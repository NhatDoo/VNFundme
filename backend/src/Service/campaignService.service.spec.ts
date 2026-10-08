import { describe, expect, it, vi } from 'vitest';
import { CampaignService } from './campaignService.service.js';

describe('CampaignService', () => {
  it('shows donors active campaigns only and includes progress', async () => {
    const prisma = {
      campaign: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: 'campaign-1',
            current: 250000,
            target: 1000000,
            _count: { donations: 2, updates: 1 },
          },
        ]),
        count: vi.fn().mockResolvedValue(1),
      },
    };
    const service = new CampaignService(prisma as never);

    const result = await service.findPublicCampaigns({});

    expect(prisma.campaign.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ status: 'ACTIVE' }),
      }),
    );
    expect(result.items[0]).toMatchObject({ id: 'campaign-1', progressPercent: 25 });
  });

  it('does not approve a campaign outside pending review', async () => {
    const prisma = {
      campaign: {
        findUnique: vi.fn().mockResolvedValue({ status: 'ACTIVE' }),
        update: vi.fn(),
      },
    };
    const service = new CampaignService(prisma as never);

    await expect(
      service.approve(
        'campaign-1',
        { id: 'admin-1', email: 'admin@example.com', role: 'ADMIN' },
      ),
    ).rejects.toThrow('Campaign cannot transition from ACTIVE');

    expect(prisma.campaign.update).not.toHaveBeenCalled();
  });

  it('clears the prior review when an owner resubmits a rejected campaign', async () => {
    const prisma = {
      campaign: {
        findUnique: vi
          .fn()
          .mockResolvedValueOnce({ creatorId: 'organizer-1' })
          .mockResolvedValueOnce({ status: 'REJECTED' }),
        update: vi.fn().mockResolvedValue({ id: 'campaign-1', status: 'PENDING_REVIEW' }),
      },
    };
    const service = new CampaignService(prisma as never);

    await service.resubmit('campaign-1', {
      id: 'organizer-1',
      email: 'organizer@example.com',
      role: 'ORGANIZER',
    });

    expect(prisma.campaign.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'PENDING_REVIEW',
          reviewerId: null,
          reviewNote: null,
          reviewedAt: null,
        }),
      }),
    );
  });
});
