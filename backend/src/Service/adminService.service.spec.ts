import { describe, expect, it, vi } from 'vitest';
import { AdminService } from './adminService.service.js';

describe('AdminService', () => {
  it('builds the dashboard from active campaigns and successful payments only', async () => {
    const prisma = {
      user: { count: vi.fn().mockResolvedValue(12) },
      campaign: {
        count: vi.fn().mockResolvedValueOnce(4).mockResolvedValueOnce(2),
      },
      payment: {
        aggregate: vi.fn().mockResolvedValue({
          _count: 8,
          _sum: { amount: 2500000 },
        }),
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    const service = new AdminService(prisma as never);

    const result = await service.getDashboard();

    expect(prisma.payment.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: 'SUCCESS' } }),
    );
    expect(result).toMatchObject({
      users: 12,
      activeCampaigns: 4,
      pendingCampaigns: 2,
      successfulPayments: 8,
      totalRaised: 2500000,
    });
  });
});
