import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus } from '../generated/prisma/enums.js';
import type * as Prisma from '../generated/prisma/internal/prismaNamespace.js';
import {
  CreateCampaignDTO,
  CreateCampaignUpdateDTO,
  ListCampaignQueryDTO,
  UpdateCampaignDTO,
} from '../DTO/request/campaignDTO.js';
import { prismaService } from './prismaService.service.js';
import { StorageService } from './storageService.service.js';
import type { AuthenticatedUser } from '../Auth/auth.types.js';

const campaignInclude = {
  category: true,
  creator: {
    select: {
      id: true,
      name: true,
      email: true,
      phonenumber: true,
    },
  },
  reviewer: {
    select: {
      id: true,
      name: true,
    },
  },
  images: {
    orderBy: {
      position: 'asc' as const,
    },
  },
  _count: {
    select: {
      donations: true,
    },
  },
} as const;

const publicCampaignSelect = {
  id: true,
  title: true,
  description: true,
  target: true,
  current: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      id: true,
      name: true,
    },
  },
  creator: {
    select: {
      id: true,
      name: true,
    },
  },
  images: {
    select: {
      id: true,
      objectName: true,
      mimeType: true,
      size: true,
      position: true,
    },
  },
  _count: {
    select: {
      donations: {
        where: { status: 'SUCCESS' },
      },
      updates: true,
    },
  },
} as const;

@Injectable()
export class CampaignService {
  constructor(
    private readonly prismaService: prismaService,
    private readonly storageService: StorageService,
  ) {}

  async create(
    creator: AuthenticatedUser,
    createCampaignDTO: CreateCampaignDTO,
  ): Promise<any> {
    if (createCampaignDTO.categoryId) {
      await this.ensureCategoryExists(createCampaignDTO.categoryId);
    }

    return this.prismaService.campaign.create({
      data: {
        title: createCampaignDTO.title,
        description: createCampaignDTO.description,
        target: createCampaignDTO.target,
        categoryId: createCampaignDTO.categoryId,
        creatorId: creator.id,
      },
      include: campaignInclude,
    });
  }

  async uploadImages(
    campaignId: string,
    actor: AuthenticatedUser,
    files: Express.Multer.File[],
  ): Promise<any> {
    await this.ensureCanManageCampaign(campaignId, actor);

    if (!files || files.length === 0) {
      throw new BadRequestException('No images provided');
    }

    if (files.length > 5) {
      throw new BadRequestException('Maximum 5 images allowed');
    }

    // Get current image count
    const existingImages = await this.prismaService.campaignImage.count({
      where: { campaignId },
    });

    if (existingImages + files.length > 5) {
      throw new BadRequestException(
        `Cannot upload ${files.length} images. Campaign already has ${existingImages} images. Maximum is 5.`,
      );
    }

    const objectNames: string[] = [];
    const createdImages: any[] = [];

    try {
      // Upload to MinIO
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const objectName = `campaigns/${campaignId}/image-${Date.now()}-${i}-${file.originalname.replace(/\s+/g, '-')}`;
        objectNames.push(objectName);
      }

      await this.storageService.uploadImages(files, objectNames);

      // Create database records
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const objectName = objectNames[i];
        const position = existingImages + i;

        const created = await this.prismaService.campaignImage.create({
          data: {
            campaignId,
            objectName,
            mimeType: file.mimetype,
            size: file.size,
            position,
          },
        });
        createdImages.push({
          ...created,
          url: this.storageService.publicUrl(objectName),
        });
      }

      return createdImages;
    } catch (error) {
      // Cleanup uploaded files on error
      if (objectNames.length > 0) {
        await this.storageService.deleteImages(objectNames);
      }
      throw error;
    }
  }

  async removeImage(
    campaignId: string,
    imageId: string,
    actor: AuthenticatedUser,
  ): Promise<any> {
    await this.ensureCanManageCampaign(campaignId, actor);

    const image = await this.prismaService.campaignImage.findUnique({
      where: { id: imageId },
    });

    if (!image || image.campaignId !== campaignId) {
      throw new NotFoundException('Image not found');
    }

    // Delete from MinIO
    await this.storageService.deleteImage(image.objectName);

    // Delete from database
    await this.prismaService.campaignImage.delete({
      where: { id: imageId },
    });

    // Reorder remaining images
    const remainingImages = await this.prismaService.campaignImage.findMany({
      where: { campaignId },
      orderBy: { position: 'asc' },
    });

    for (let i = 0; i < remainingImages.length; i++) {
      if (remainingImages[i].position !== i) {
        await this.prismaService.campaignImage.update({
          where: { id: remainingImages[i].id },
          data: { position: i },
        });
      }
    }

    return { success: true };
  }

  async getCampaignImages(campaignId: string): Promise<any> {
    const images = await this.prismaService.campaignImage.findMany({
      where: { campaignId },
      orderBy: { position: 'asc' },
    });

    return images.map((img) => ({
      ...img,
      url: this.storageService.publicUrl(img.objectName),
    }));
  }

  async findPublicCampaigns(query: ListCampaignQueryDTO): Promise<any> {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    const skip = (page - 1) * limit;
    const where = this.buildCampaignWhere(query, true);
    const orderBy = this.buildCampaignOrderBy(query);

    const [items, total] = await Promise.all([
      this.prismaService.campaign.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: publicCampaignSelect,
      }),
      this.prismaService.campaign.count({ where }),
    ]);

    return {
      items: items.map((campaign) => this.withProgress(campaign)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findPublicCampaign(id: string): Promise<any> {
    const campaign = await this.prismaService.campaign.findFirst({
      where: { id, status: CampaignStatus.ACTIVE },
      select: publicCampaignSelect,
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    return this.withProgress(campaign);
  }

  async findPublicUpdates(campaignId: string): Promise<any> {
    await this.ensurePublicCampaignExists(campaignId);

    return this.prismaService.campaignUpdate.findMany({
      where: { campaignId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        content: true,
        amountUsed: true,
        createdAt: true,
      },
    });
  }

  async update(
    id: string,
    actor: AuthenticatedUser,
    updateCampaignDTO: UpdateCampaignDTO,
  ): Promise<any> {
    await this.ensureCanManageCampaign(id, actor);

    const data: Prisma.CampaignUncheckedUpdateInput = {};

    if (updateCampaignDTO.title !== undefined) {
      data.title = updateCampaignDTO.title;
    }

    if (updateCampaignDTO.description !== undefined) {
      data.description = updateCampaignDTO.description;
    }

    if (updateCampaignDTO.target !== undefined) {
      data.target = updateCampaignDTO.target;
    }

    if (updateCampaignDTO.categoryId !== undefined) {
      await this.ensureCategoryExists(updateCampaignDTO.categoryId);
      data.categoryId = updateCampaignDTO.categoryId;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No campaign data to update');
    }

    return this.prismaService.campaign.update({
      where: { id },
      data,
      include: campaignInclude,
    });
  }

  async createUpdate(
    campaignId: string,
    actor: AuthenticatedUser,
    dto: CreateCampaignUpdateDTO,
  ): Promise<any> {
    await this.ensureCanManageCampaign(campaignId, actor);

    return this.prismaService.campaignUpdate.create({
      data: {
        campaignId,
        title: dto.title,
        content: dto.content,
        amountUsed: dto.amountUsed,
      },
    });
  }

  async findMine(actor: AuthenticatedUser, query: ListCampaignQueryDTO): Promise<any> {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    const skip = (page - 1) * limit;
    const where = this.buildCampaignWhere(query);
    where.creatorId = actor.id;

    const [items, total] = await Promise.all([
      this.prismaService.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: this.buildCampaignOrderBy(query),
        include: campaignInclude,
      }),
      this.prismaService.campaign.count({ where }),
    ]);

    return {
      items: items.map((campaign) => this.withProgress(campaign)),
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getOrganizerDashboard(actor: AuthenticatedUser): Promise<any> {
    const where = { creatorId: actor.id };
    const [campaigns, donations, successfulDonations] = await Promise.all([
      this.prismaService.campaign.count({ where }),
      this.prismaService.donation.count({ where: { campaign: where } }),
      this.prismaService.donation.aggregate({
        where: { campaign: where, status: 'SUCCESS' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    return {
      campaigns,
      donations,
      successfulDonations: successfulDonations._count,
      totalRaised: successfulDonations._sum.amount ?? 0,
    };
  }

  async findDonors(campaignId: string, actor: AuthenticatedUser): Promise<any> {
    await this.ensureCanManageCampaign(campaignId, actor);

    return this.prismaService.donation.findMany({
      where: { campaignId, status: 'SUCCESS' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        amount: true,
        createdAt: true,
        donor: {
          select: {
            id: true,
            name: true,
          },
        },
        payment: {
          select: {
            provider: true,
            reference: true,
            paidAt: true,
          },
        },
      },
    });
  }

  async approve(
    id: string,
    reviewer: AuthenticatedUser,
    reviewNote?: string,
  ): Promise<any> {
    await this.ensureCampaignHasStatus(id, [CampaignStatus.PENDING_REVIEW]);
    return this.prismaService.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.ACTIVE,
        reviewerId: reviewer.id,
        reviewNote: reviewNote?.trim() || null,
        reviewedAt: new Date(),
      },
      include: campaignInclude,
    });
  }

  async reject(
    id: string,
    reviewer: AuthenticatedUser,
    reviewNote: string,
  ): Promise<any> {
    await this.ensureCampaignHasStatus(id, [CampaignStatus.PENDING_REVIEW]);
    return this.prismaService.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.REJECTED,
        reviewerId: reviewer.id,
        reviewNote: reviewNote.trim(),
        reviewedAt: new Date(),
      },
      include: campaignInclude,
    });
  }

  async resubmit(id: string, actor: AuthenticatedUser): Promise<any> {
    await this.ensureCanManageCampaign(id, actor);
    await this.ensureCampaignHasStatus(id, [CampaignStatus.REJECTED]);
    return this.prismaService.campaign.update({
      where: { id },
      data: {
        status: CampaignStatus.PENDING_REVIEW,
        reviewerId: null,
        reviewNote: null,
        reviewedAt: null,
      },
      include: campaignInclude,
    });
  }

  async complete(id: string, actor: AuthenticatedUser): Promise<any> {
    await this.ensureCanManageCampaign(id, actor);
    await this.ensureCampaignHasStatus(id, [CampaignStatus.ACTIVE]);
    return this.updateStatus(id, CampaignStatus.COMPLETED);
  }

  async cancel(id: string, actor: AuthenticatedUser): Promise<any> {
    await this.ensureCanManageCampaign(id, actor);
    await this.ensureCampaignHasStatus(id, [
      CampaignStatus.PENDING_REVIEW,
      CampaignStatus.ACTIVE,
    ]);
    return this.updateStatus(id, CampaignStatus.CANCELLED);
  }

  async remove(id: string, actor: AuthenticatedUser): Promise<any> {
    const campaign = await this.prismaService.campaign.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            donations: true,
          },
        },
      },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.ensureCampaignOwner(campaign.creatorId, actor);

    if (campaign._count.donations > 0) {
      return this.updateStatus(id, CampaignStatus.CANCELLED);
    }

    return this.prismaService.campaign.delete({
      where: { id },
    });
  }

  private async ensureCampaignExists(id: string): Promise<void> {
    const campaign = await this.prismaService.campaign.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }
  }

  private async ensureCampaignHasStatus(
    id: string,
    allowedStatuses: CampaignStatus[],
  ): Promise<void> {
    const campaign = await this.prismaService.campaign.findUnique({
      where: { id },
      select: { status: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    if (!allowedStatuses.includes(campaign.status)) {
      throw new BadRequestException(
        `Campaign cannot transition from ${campaign.status}`,
      );
    }
  }

  private async ensurePublicCampaignExists(id: string): Promise<void> {
    const campaign = await this.prismaService.campaign.findFirst({
      where: { id, status: CampaignStatus.ACTIVE },
      select: { id: true },
    });

    if (!campaign) {
      throw new NotFoundException('Active campaign not found');
    }
  }

  private async ensureCanManageCampaign(
    id: string,
    actor: AuthenticatedUser,
  ): Promise<void> {
    const campaign = await this.prismaService.campaign.findUnique({
      where: { id },
      select: { creatorId: true },
    });

    if (!campaign) {
      throw new NotFoundException('Campaign not found');
    }

    this.ensureCampaignOwner(campaign.creatorId, actor);
  }

  private ensureCampaignOwner(
    creatorId: string,
    actor: AuthenticatedUser,
  ): void {
    if (creatorId !== actor.id) {
      throw new ForbiddenException('You cannot manage this campaign');
    }
  }

  private updateStatus(id: string, status: CampaignStatus): Promise<any> {
    return this.prismaService.campaign.update({
      where: { id },
      data: { status },
      include: campaignInclude,
    });
  }

  private buildCampaignWhere(
    query: ListCampaignQueryDTO,
    activeOnly = false,
  ): Prisma.CampaignWhereInput {
    const where: Prisma.CampaignWhereInput = {};

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (activeOnly) {
      where.status = CampaignStatus.ACTIVE;
    } else if (query.status) {
      where.status = query.status;
    }

    if (query.creatorId) {
      where.creatorId = query.creatorId;
    }

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    return where;
  }

  private buildCampaignOrderBy(
    query: ListCampaignQueryDTO,
  ): Prisma.CampaignOrderByWithRelationInput {
    const allowedSortFields = new Set([
      'createdAt',
      'updatedAt',
      'target',
      'current',
      'title',
      'status',
    ]);
    const sortBy =
      query.sortBy && allowedSortFields.has(query.sortBy)
        ? query.sortBy
        : 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    return {
      [sortBy]: sortOrder,
    };
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);

    if (Number.isNaN(parsed) || parsed < 1) {
      return fallback;
    }

    return parsed;
  }

  private withProgress<T extends { current: unknown; target: unknown }>(campaign: T): T & { progressPercent: number } {
    const target = Number(campaign.target);
    const current = Number(campaign.current);
    const progressPercent = target > 0 ? Math.min((current / target) * 100, 100) : 0;

    return { ...campaign, progressPercent: Number(progressPercent.toFixed(2)) };
  }

  private async ensureCategoryExists(id: string): Promise<void> {
    const category = await this.prismaService.campaignCategory.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!category) {
      throw new NotFoundException('Campaign category not found');
    }
  }
}
