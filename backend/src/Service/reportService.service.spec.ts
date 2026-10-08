import { describe, expect, it, vi } from 'vitest';
import { ReportService } from './reportService.service.js';

describe('ReportService', () => {
  it('returns only successful donations without donor identity for public history', async () => {
    const prisma = {
      campaign: {
        findFirst: vi.fn().mockResolvedValue({ id: 'campaign-1' }),
      },
      donation: {
        findMany: vi.fn().mockResolvedValue([
          { id: 'donation-1', amount: 100000, createdAt: new Date() },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const service = new ReportService(prisma as never);

    const result = await service.findPublicDonations('campaign-1', {});

    expect(prisma.donation.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { campaignId: 'campaign-1', status: 'SUCCESS' },
        select: { id: true, amount: true, createdAt: true },
      }),
    );
    expect(result.items).toHaveLength(1);
  });
});
