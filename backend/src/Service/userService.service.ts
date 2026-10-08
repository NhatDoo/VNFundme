import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { prismaService } from './prismaService.service.js';
import { AuthService } from './authService.service.js';
import { RegisterDTO } from '../DTO/request/registerDTO.js';
import { ChangeProfileDTO } from '../DTO/request/changeProfileDTO.js';
import * as bcrypt from 'bcrypt';
import { UserRole, UserStatus } from '../generated/prisma/enums.js';
import type * as Prisma from '../generated/prisma/internal/prismaNamespace.js';
import {
  ListUsersQueryDTO,
  UpdateProfileDataDTO,
} from '../DTO/request/userDTO.js';

const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phonenumber: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  _count: {
    select: {
      campaigns: true,
      donations: true,
    },
  },
} as const;

@Injectable()
export class UserService {
  constructor(
    private readonly authService: AuthService,
    private readonly prismaService: prismaService,
  ) {}

  async register(userData: RegisterDTO): Promise<any> {
    await this.ensureEmailAndPhoneAvailable(
      userData.email,
      userData.phonenumber,
    );

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.prismaService.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
      select: publicUserSelect,
    });
    return user;
  }

  async login(
    email: string,
    password: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const user = await this.prismaService.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('User account is locked');
    }

    if (user.status === UserStatus.DELETED) {
      throw new ForbiddenException('User account has been deleted');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { email: user.email, sub: user.id, role: user.role };
    return this.authService.createTokenPair(payload);
  }

  async changepassword(
    id: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
    });

    if (!user || user.status === UserStatus.DELETED) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('User account is locked');
    }

    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid old password');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    return this.prismaService.user.update({
      where: { id },
      data: { password: hashedNewPassword },
      select: publicUserSelect,
    });
  }

  async changeProfile(
    id: string,
    newProfileData: ChangeProfileDTO['newProfileData'],
  ): Promise<any> {
    const user = await this.findActiveUserById(id);
    const data = await this.buildProfileUpdateData(user.id, newProfileData);

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No user profile data to update');
    }

    return this.prismaService.user.update({
      where: { id: user.id },
      data,
      select: publicUserSelect,
    });
  }

  async getProfile(id: string): Promise<any> {
    return this.findActiveUserById(id, publicUserSelect);
  }

  async findAll(query: ListUsersQueryDTO): Promise<any> {
    const page = this.parsePositiveInt(query.page, 1);
    const limit = Math.min(this.parsePositiveInt(query.limit, 10), 100);
    const skip = (page - 1) * limit;
    const where = this.buildUserWhere(query);
    const orderBy = this.buildUserOrderBy(query);

    const [items, total] = await Promise.all([
      this.prismaService.user.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        select: publicUserSelect,
      }),
      this.prismaService.user.count({ where }),
    ]);

    return {
      items,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<any> {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        status: {
          not: UserStatus.DELETED,
        },
      },
      select: publicUserSelect,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateRole(id: string, role: UserRole): Promise<any> {
    await this.ensureUserExists(id);

    return this.prismaService.user.update({
      where: { id },
      data: { role },
      select: publicUserSelect,
    });
  }

  async lock(id: string): Promise<any> {
    await this.ensureUserExists(id);
    return this.updateStatus(id, UserStatus.LOCKED);
  }

  async unlock(id: string): Promise<any> {
    await this.ensureUserExists(id);
    return this.updateStatus(id, UserStatus.ACTIVE);
  }

  async softDelete(id: string): Promise<any> {
    await this.ensureUserExists(id);

    return this.prismaService.user.update({
      where: { id },
      data: {
        status: UserStatus.DELETED,
        deletedAt: new Date(),
      },
      select: publicUserSelect,
    });
  }

  private async findActiveUserByEmail(
    email: string,
    select?: typeof publicUserSelect,
  ): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
      select,
    });

    if (!user || user.status === UserStatus.DELETED) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('User account is locked');
    }

    return user;
  }

  private async findActiveUserById(
    id: string,
    select?: typeof publicUserSelect,
  ): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select,
    });

    if (!user || user.status === UserStatus.DELETED) {
      throw new NotFoundException('User not found');
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('User account is locked');
    }

    return user;
  }

  private async ensureUserExists(id: string): Promise<void> {
    const user = await this.prismaService.user.findFirst({
      where: {
        id,
        status: {
          not: UserStatus.DELETED,
        },
      },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }
  }

  private updateStatus(id: string, status: UserStatus): Promise<any> {
    return this.prismaService.user.update({
      where: { id },
      data: {
        status,
        deletedAt: null,
      },
      select: publicUserSelect,
    });
  }

  private async buildProfileUpdateData(
    userId: string,
    profileData: UpdateProfileDataDTO,
  ): Promise<Prisma.UserUpdateInput> {
    const data: Prisma.UserUpdateInput = {};

    if (profileData.name !== undefined) {
      data.name = profileData.name;
    }

    if (profileData.email !== undefined) {
      await this.ensureEmailAndPhoneAvailable(
        profileData.email,
        undefined,
        userId,
      );
      data.email = profileData.email;
    }

    if (profileData.phonenumber !== undefined) {
      await this.ensureEmailAndPhoneAvailable(
        undefined,
        profileData.phonenumber,
        userId,
      );
      data.phonenumber = profileData.phonenumber;
    }

    return data;
  }

  private async ensureEmailAndPhoneAvailable(
    email?: string,
    phonenumber?: string,
    excludeUserId?: string,
  ): Promise<void> {
    const OR: Prisma.UserWhereInput[] = [];

    if (email) {
      OR.push({ email });
    }

    if (phonenumber) {
      OR.push({ phonenumber });
    }

    if (OR.length === 0) {
      return;
    }

    const existingUser = await this.prismaService.user.findFirst({
      where: {
        OR,
        ...(excludeUserId ? { id: { not: excludeUserId } } : {}),
      },
      select: { email: true, phonenumber: true },
    });

    if (!existingUser) {
      return;
    }

    if (existingUser.email === email) {
      throw new ConflictException('Email already exists');
    }

    throw new ConflictException('Phone number already exists');
  }

  private buildUserWhere(query: ListUsersQueryDTO): Prisma.UserWhereInput {
    const where: Prisma.UserWhereInput = {};

    if (query.includeDeleted !== 'true') {
      where.status = {
        not: UserStatus.DELETED,
      };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phonenumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.status) {
      where.status = query.status;
    }

    return where;
  }

  private buildUserOrderBy(
    query: ListUsersQueryDTO,
  ): Prisma.UserOrderByWithRelationInput {
    const allowedSortFields = new Set([
      'createdAt',
      'updatedAt',
      'name',
      'email',
      'role',
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
}
