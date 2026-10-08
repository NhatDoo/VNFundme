import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, DonationStatus, PaymentStatus, UserRole } from '../generated/prisma/enums.js';
import { prismaService } from './prismaService.service.js';
import type { AuthenticatedUser } from '../Auth/auth.types.js';
import type { CreateFundUsageReportDTO, PaginationQueryDTO } from '../DTO/request/reportDTO.js';

const publicCampaignStatuses = [CampaignStatus.ACTIVE, CampaignStatus.COMPLETED];

@Injectable()
export class ReportService {
  constructor(private readonly prismaService: prismaService) {}

  async createFundUsageReport(
    campaignId: string,
    actor: AuthenticatedUser,
    dto: CreateFundUsageReportDTO,
  ): Promise<any> {
    return this.prismaService.$transaction(
      async (transaction) => {
        const campaign = await transaction.campaign.findUnique({
          where: { id: campaignId },
          select: { creatorId: true },
        });

        if (!campaign) {
          throw new NotFoundException('Campaign not found');
        }

        if (actor.role !== UserRole.ADMIN && campaign.creatorId !== actor.id) {
          throw new ForbiddenException('You cannot manage this campaign');
        }

        const [donations, usage] = await Promise.all([
          transaction.donation.aggregate({
            where: { campaignId, status: DonationStatus.SUCCESS },
            _sum: { amount: true },
          }),
          transaction.fundUsageReport.aggregate({
            where: { campaignId },
            _sum: { amountUsed: true },
          }),
        ]);
        const totalRaised = Number(donations._sum.amount ?? 0);
        const totalUsed = Number(usage._sum.amountUsed ?? 0);

        if (totalUsed + dto.amountUsed > totalRaised) {
          throw new BadRequestException('Fund usage exceeds the amount raised');
        }

        return transaction.fundUsageReport.create({
          data: {
            campaignId,
            createdById: actor.id,
            title: dto.title,
            description: dto.description,
            amountUsed: dto.amountUsed,
            usedAt: new Date(dto.usedAt),
          },
          select: this.publicReportSelect,
        });
      },
      { isolationLevel: 'Serializable' },
    );
  }

  async getCampaignSummary(campaignId: string): Promise<any> {
    const campaign = await this.prismaService.campaign.findFirst({
      where: { id: campaignId, status: { in: publicCampaignStatuses } },
      select: {
        id: true,
        title: true,
        target: true,
        current: true,
        status: true,
        category: { select: { id: true, name: true } },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Public campaign not found');
    }

    const [donations, usage] = await Promise.all([
      this.prismaService.donation.aggregate({
        where: { campaignId, status: DonationStatus.SUCCESS },
        _count: true,
        _sum: { amount: true },
      }),
      this.prismaService.fundUsageReport.aggregate({
        where: { campaignId },
        _count: true,
        _sum: { amountUsed: true },
      }),
    ]);

    const totalRaised = donations._sum.amount ?? 0;
    const totalUsed = usage._sum.amountUsed ?? 0;
    const target = Number(campaign.target);
    const current = Number(campaign.current);

    return {
      campaign,
      donationCount: donations._count,
      reportCount: usage._count,
      totalRaised,
      totalUsed,
      remainingBalance: Number(totalRaised) - Number(totalUsed),
      progressPercent: target > 0 ? Number(Math.min((current / target) * 100, 100).toFixed(2)) : 0,
    };
  }

  async findPublicDonations(campaignId: string, query: PaginationQueryDTO): Promise<any> {
    await this.ensurePublicCampaign(campaignId);
    const { page, limit, skip } = this.getPagination(query);
    const where = { campaignId, status: DonationStatus.SUCCESS };

    const [items, total] = await Promise.all([
      this.prismaService.donation.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { id: true, amount: true, createdAt: true },
      }),
      this.prismaService.donation.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findFundUsageReports(campaignId: string, query: PaginationQueryDTO): Promise<any> {
    await this.ensurePublicCampaign(campaignId);
    const { page, limit, skip } = this.getPagination(query);
    const where = { campaignId };

    const [items, total] = await Promise.all([
      this.prismaService.fundUsageReport.findMany({
        where,
        skip,
        take: limit,
        orderBy: { usedAt: 'desc' },
        select: this.publicReportSelect,
      }),
      this.prismaService.fundUsageReport.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async getOverview(): Promise<any> {
    const [campaigns, payments, donations, reportUsage] = await Promise.all([
      this.prismaService.campaign.count({
        where: { status: { in: publicCampaignStatuses } },
      }),
      this.prismaService.payment.aggregate({
        where: { status: PaymentStatus.SUCCESS },
        _count: true,
        _sum: { amount: true },
      }),
      this.prismaService.donation.count({ where: { status: DonationStatus.SUCCESS } }),
      this.prismaService.fundUsageReport.aggregate({ _sum: { amountUsed: true } }),
    ]);

    const totalRaised = payments._sum.amount ?? 0;
    const totalUsed = reportUsage._sum.amountUsed ?? 0;

    return {
      publicCampaigns: campaigns,
      successfulPayments: payments._count,
      successfulDonations: donations,
      totalRaised,
      totalUsed,
      remainingBalance: Number(totalRaised) - Number(totalUsed),
    };
  }

  private get publicReportSelect() {
    return {
      id: true,
      title: true,
      description: true,
      amountUsed: true,
      usedAt: true,
      createdAt: true,
    } as const;
  }

  private async ensurePublicCampaign(campaignId: string): Promise<void> {
    const campaign = await this.prismaService.campaign.findFirst({
      where: { id: campaignId, status: { in: publicCampaignStatuses } },
      select: { id: true },
    });

    if (!campaign) {
      throw new NotFoundException('Public campaign not found');
    }
  }

  private getPagination(query: PaginationQueryDTO): { page: number; limit: number; skip: number } {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    return { page, limit, skip: (page - 1) * limit };
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  }
}
