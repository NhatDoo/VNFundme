import { createHmac } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { PaymentService } from './paymentService.service.js';

const hashSecret = 'test-vnpay-hash-secret';

function sign(params: Record<string, string>): string {
  const data = Object.entries(params)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value).replace(/%20/g, '+')}`)
    .join('&');

  return createHmac('sha512', hashSecret).update(data, 'utf8').digest('hex');
}

describe('PaymentService', () => {
  it('records a successful payment and increments the campaign once', async () => {
    const transaction = {
      payment: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      donation: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      campaign: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
    };
    const prisma = {
      payment: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'payment-1',
          amount: 100000,
          status: 'PENDING',
        }),
      },
      $transaction: vi.fn(async (callback) => callback(transaction)),
    };
    const config = { get: vi.fn().mockReturnValue(hashSecret) };
    const service = new PaymentService(prisma as never, config as never);
    const params = {
      vnp_Amount: '10000000',
      vnp_ResponseCode: '00',
      vnp_TransactionStatus: '00',
      vnp_TxnRef: 'VN20260917143000ABCDEF123456',
      vnp_TransactionNo: '14123456',
    };

    const result = await service.handleVnpayCallback({
      ...params,
      vnp_SecureHash: sign(params),
    });

    expect(result).toMatchObject({ processed: true, payment: { status: 'SUCCESS' } });
    expect(transaction.campaign.updateMany).toHaveBeenCalledTimes(1);
  });

  it('rejects a callback with an invalid signature before changing data', async () => {
    const prisma = { payment: { findUnique: vi.fn() } };
    const config = { get: vi.fn().mockReturnValue(hashSecret) };
    const service = new PaymentService(prisma as never, config as never);

    await expect(
      service.handleVnpayCallback({
        vnp_Amount: '10000000',
        vnp_ResponseCode: '00',
        vnp_TxnRef: 'VN20260917143000ABCDEF123456',
        vnp_SecureHash: '0'.repeat(128),
      }),
    ).rejects.toThrow('Invalid VNPay secure hash');

    expect(prisma.payment.findUnique).not.toHaveBeenCalled();
  });
});
