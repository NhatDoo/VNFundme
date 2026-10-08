import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserStatus } from '../generated/prisma/enums.js';
import { prismaService } from './prismaService.service.js';
import type { AuthenticatedUser, JwtPayload } from '../Auth/auth.types.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prismaService: prismaService,
  ) {}

  async createTokenPair(
    payload: Omit<JwtPayload, 'tokenType'>,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, tokenType: 'access' },
        { secret: this.accessTokenSecret, expiresIn: '15m' },
      ),
      this.jwtService.signAsync(
        { ...payload, tokenType: 'refresh' },
        { secret: this.refreshTokenSecret, expiresIn: '7d' },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const payload = await this.verifyToken(refreshToken, 'refresh');
    const user = await this.getActiveUser(payload.sub);

    return this.createTokenPair({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
  }

  async validateAccessToken(token: string): Promise<AuthenticatedUser> {
    const payload = await this.verifyToken(token, 'access');
    return this.getActiveUser(payload.sub);
  }

  private async verifyToken(
    token: string,
    tokenType: JwtPayload['tokenType'],
  ): Promise<JwtPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, {
        secret: tokenType === 'access' ? this.accessTokenSecret : this.refreshTokenSecret,
      });

      if (payload.tokenType !== tokenType || !payload.sub) {
        throw new UnauthorizedException('Invalid token');
      }

      return payload;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  private async getActiveUser(id: string): Promise<AuthenticatedUser> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: { id: true, email: true, role: true, status: true },
    });

    if (!user || user.status === UserStatus.DELETED) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status === UserStatus.LOCKED) {
      throw new ForbiddenException('User account is locked');
    }

    return { id: user.id, email: user.email, role: user.role };
  }

  private get accessTokenSecret(): string {
    return this.getRequiredSecret('JWT_ACCESS_SECRET');
  }

  private get refreshTokenSecret(): string {
    return this.getRequiredSecret('JWT_REFRESH_SECRET');
  }

  private getRequiredSecret(name: string): string {
    const secret = this.configService.get<string>(name);

    if (!secret) {
      throw new Error(`${name} must be configured`);
    }

    return secret;
  }
}
