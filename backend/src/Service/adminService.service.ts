import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CampaignStatus, PaymentStatus, UserStatus } from '../generated/prisma/enums.js';
import { prismaService } from './prismaService.service.js';
import type { CreateCategoryDTO, UpdateCategoryDTO } from '../DTO/request/categoryDTO.js';
import type { ListTransactionsQueryDTO } from '../DTO/request/adminDTO.js';
import type { ListCampaignQueryDTO } from '../DTO/request/campaignDTO.js';

@Injectable()
export class AdminService {
  constructor(private readonly prismaService: prismaService) {}

  async getDashboard(): Promise<any> {
    const [users, activeCampaigns, pendingCampaigns, paymentSummary, recentPayments] =
      await Promise.all([
        this.prismaService.user.count({
          where: { status: { not: UserStatus.DELETED } },
        }),
        this.prismaService.campaign.count({ where: { status: CampaignStatus.ACTIVE } }),
        this.prismaService.campaign.count({
          where: { status: CampaignStatus.PENDING_REVIEW },
        }),
        this.prismaService.payment.aggregate({
          where: { status: PaymentStatus.SUCCESS },
          _sum: { amount: true },
          _count: true,
        }),
        this.prismaService.payment.findMany({
          where: { status: PaymentStatus.SUCCESS },
          take: 5,
          orderBy: { paidAt: 'desc' },
          select: {
            id: true,
            reference: true,
            amount: true,
            paidAt: true,
            donation: {
              select: {
                campaign: { select: { id: true, title: true } },
                donor: { select: { id: true, name: true } },
              },
            },
          },
        }),
      ]);

    return {
      users,
      activeCampaigns,
      pendingCampaigns,
      successfulPayments: paymentSummary._count,
      totalRaised: paymentSummary._sum.amount ?? 0,
      recentPayments,
    };
  }

  async findCampaigns(query: ListCampaignQueryDTO): Promise<any> {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    const skip = (page - 1) * limit;
    const where = this.buildCampaignWhere(query);

    const [items, total] = await Promise.all([
      this.prismaService.campaign.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          creator: { select: { id: true, name: true, email: true } },
          _count: { select: { donations: true, updates: true } },
        },
      }),
      this.prismaService.campaign.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findTransactions(query: ListTransactionsQueryDTO): Promise<any> {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    const skip = (page - 1) * limit;
    const where = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { reference: { contains: query.search.trim(), mode: 'insensitive' as const } },
              { transactionId: { contains: query.search.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prismaService.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          donation: {
            select: {
              id: true,
              status: true,
              campaign: { select: { id: true, title: true } },
              donor: { select: { id: true, name: true, email: true } },
            },
          },
        },
      }),
      this.prismaService.payment.count({ where }),
    ]);

    return { items, meta: { page, limit, total, totalPages: Math.ceil(total / limit) } };
  }

  async findCategories(): Promise<any> {
    return this.prismaService.campaignCategory.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { campaigns: true } } },
    });
  }

  async createCategory(dto: CreateCategoryDTO): Promise<any> {
    try {
      return await this.prismaService.campaignCategory.create({ data: dto });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Category name already exists');
      }
      throw error;
    }
  }

  async updateCategory(id: string, dto: UpdateCategoryDTO): Promise<any> {
    if (Object.keys(dto).length === 0) {
      throw new BadRequestException('No category data to update');
    }

    try {
      return await this.prismaService.campaignCategory.update({ where: { id }, data: dto });
    } catch (error: unknown) {
      if (this.isUniqueConstraintError(error)) {
        throw new ConflictException('Category name already exists');
      }
      if (this.isNotFoundError(error)) {
        throw new NotFoundException('Category not found');
      }
      throw error;
    }
  }

  async removeCategory(id: string): Promise<any> {
    const category = await this.prismaService.campaignCategory.findUnique({
      where: { id },
      include: { _count: { select: { campaigns: true } } },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.campaigns > 0) {
      throw new BadRequestException('Category is still assigned to campaigns');
    }

    return this.prismaService.campaignCategory.delete({ where: { id } });
  }

  private buildCampaignWhere(query: ListCampaignQueryDTO) {
    return {
      ...(query.status ? { status: query.status } : {}),
      ...(query.creatorId ? { creatorId: query.creatorId } : {}),
      ...(query.categoryId ? { categoryId: query.categoryId } : {}),
      ...(query.search?.trim()
        ? {
            OR: [
              { title: { contains: query.search.trim(), mode: 'insensitive' as const } },
              { description: { contains: query.search.trim(), mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
  }

  private parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value) return fallback;
    const parsed = Number.parseInt(value, 10);
    return Number.isNaN(parsed) || parsed < 1 ? fallback : parsed;
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private isNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
  }
}
