import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import {
  CampaignStatus,
  DonationStatus,
  PaymentStatus,
} from '../generated/prisma/enums.js';
import { prismaService } from './prismaService.service.js';
import type { AuthenticatedUser } from '../Auth/auth.types.js';
import type {
  CreateVnpayPaymentDTO,
  PaymentHistoryQueryDTO,
} from '../DTO/request/paymentDTO.js';

type VnpayParams = Record<string, string | undefined>;

const paymentHistoryInclude = {
  donation: {
    select: {
      id: true,
      amount: true,
      status: true,
      createdAt: true,
      campaign: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  },
} as const;

@Injectable()
export class PaymentService {
  constructor(
    private readonly prismaService: prismaService,
    private readonly configService: ConfigService,
  ) {}

  async createVnpayPayment(
    user: AuthenticatedUser,
    dto: CreateVnpayPaymentDTO,
    ipAddress: string,
  ): Promise<{ paymentUrl: string; reference: string }> {
    const campaign = await this.prismaService.campaign.findFirst({
      where: { id: dto.campaignId, status: CampaignStatus.ACTIVE },
      select: { id: true },
    });

    if (!campaign) {
      throw new NotFoundException('Active campaign not found');
    }

    const reference = this.createReference();
    const params: VnpayParams = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.getRequiredConfig('VNPAY_TMN_CODE'),
      vnp_Amount: String(dto.amount * 100),
      vnp_CurrCode: 'VND',
      vnp_TxnRef: reference,
      vnp_OrderInfo: `Donation ${reference}`,
      vnp_OrderType: 'other',
      vnp_Locale: dto.locale ?? 'vn',
      vnp_ReturnUrl: this.getRequiredConfig('VNPAY_RETURN_URL'),
      vnp_IpAddr: ipAddress,
      vnp_CreateDate: this.formatVnpayDate(new Date()),
      vnp_ExpireDate: this.formatVnpayDate(new Date(Date.now() + 15 * 60 * 1000)),
    };

    if (dto.bankCode) {
      params.vnp_BankCode = dto.bankCode;
    }

    const paymentUrl = this.buildPaymentUrl(params);
    await this.prismaService.payment.create({
      data: {
        reference,
        amount: dto.amount,
        donation: {
          create: {
            amount: dto.amount,
            campaignId: campaign.id,
            donorId: user.id,
          },
        },
      },
    });

    return { paymentUrl, reference };
  }

  async handleVnpayCallback(params: VnpayParams): Promise<any> {
    this.verifyCallbackSignature(params);

    const reference = params.vnp_TxnRef;
    const amount = params.vnp_Amount;

    if (!reference || !amount || !/^\d+$/.test(amount)) {
      throw new BadRequestException('Missing VNPay transaction data');
    }

    const payment = await this.prismaService.payment.findUnique({
      where: { reference },
      select: { id: true, amount: true, status: true },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (Number(payment.amount) * 100 !== Number(amount)) {
      throw new BadRequestException('VNPay amount does not match payment');
    }

    const isSuccessful =
      params.vnp_ResponseCode === '00' &&
      (!params.vnp_TransactionStatus || params.vnp_TransactionStatus === '00');

    if (payment.status !== PaymentStatus.PENDING) {
      return { payment, processed: false };
    }

    const result = await this.prismaService.$transaction(async (transaction) => {
      const paymentUpdate = await transaction.payment.updateMany({
        where: { id: payment.id, status: PaymentStatus.PENDING },
        data: {
          status: isSuccessful ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          responseCode: params.vnp_ResponseCode,
          bankCode: params.vnp_BankCode,
          transactionId: params.vnp_TransactionNo,
          ...(isSuccessful ? { paidAt: new Date() } : {}),
        },
      });

      if (paymentUpdate.count === 0) {
        return { processed: false };
      }

      const donationUpdate = await transaction.donation.updateMany({
        where: { payment: { id: payment.id }, status: DonationStatus.PENDING },
        data: {
          status: isSuccessful ? DonationStatus.SUCCESS : DonationStatus.FAILED,
        },
      });

      if (donationUpdate.count === 0) {
        throw new BadRequestException('Donation is not pending');
      }

      if (isSuccessful) {
        await transaction.campaign.updateMany({
          where: {
            donations: { some: { payment: { id: payment.id } } },
          },
          data: { current: { increment: payment.amount } },
        });
      }

      return { processed: true };
    });

    return { payment: { ...payment, status: isSuccessful ? PaymentStatus.SUCCESS : PaymentStatus.FAILED }, ...result };
  }

  async getHistory(userId: string, query: PaymentHistoryQueryDTO): Promise<any> {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    const skip = (page - 1) * limit;
    const where = { donation: { donorId: userId } };

    const [items, total] = await Promise.all([
      this.prismaService.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: paymentHistoryInclude,
      }),
      this.prismaService.payment.count({ where }),
    ]);

    return {
      items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  private buildPaymentUrl(params: VnpayParams): string {
    const signData = this.buildSignData(params);
    const secureHash = createHmac('sha512', this.getRequiredConfig('VNPAY_HASH_SECRET'))
      .update(signData, 'utf8')
      .digest('hex');

    return `${this.getRequiredConfig('VNPAY_URL')}?${signData}&vnp_SecureHash=${secureHash}`;
  }

  private verifyCallbackSignature(params: VnpayParams): void {
    const receivedHash = params.vnp_SecureHash;

    if (!receivedHash || !/^[a-fA-F0-9]{128}$/.test(receivedHash)) {
      throw new BadRequestException('Invalid VNPay secure hash');
    }

    const signingParams = Object.fromEntries(
      Object.entries(params).filter(
        ([key, value]) =>
          key !== 'vnp_SecureHash' && key !== 'vnp_SecureHashType' && value !== undefined,
      ),
    );
    const expectedHash = createHmac('sha512', this.getRequiredConfig('VNPAY_HASH_SECRET'))
      .update(this.buildSignData(signingParams), 'utf8')
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedHash, 'hex');
    const receivedBuffer = Buffer.from(receivedHash, 'hex');

    if (
      expectedBuffer.length !== receivedBuffer.length ||
      !timingSafeEqual(expectedBuffer, receivedBuffer)
    ) {
      throw new BadRequestException('Invalid VNPay secure hash');
    }
  }

  private buildSignData(params: VnpayParams): string {
    return Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${this.encode(key)}=${this.encode(value ?? '')}`)
      .join('&');
  }

  private createReference(): string {
    return `VN${this.formatVnpayDate(new Date())}${randomBytes(6).toString('hex').toUpperCase()}`;
  }

  private formatVnpayDate(date: Date): string {
    const vietnamTime = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    const pad = (value: number) => String(value).padStart(2, '0');

    return `${vietnamTime.getUTCFullYear()}${pad(vietnamTime.getUTCMonth() + 1)}${pad(vietnamTime.getUTCDate())}${pad(vietnamTime.getUTCHours())}${pad(vietnamTime.getUTCMinutes())}${pad(vietnamTime.getUTCSeconds())}`;
  }

  private encode(value: string): string {
    return encodeURIComponent(value).replace(/%20/g, '+');
  }

  private getRequiredConfig(name: string): string {
    const value = this.configService.get<string>(name);

    if (!value) {
      throw new Error(`${name} must be configured`);
    }

    return value;
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  }
}
