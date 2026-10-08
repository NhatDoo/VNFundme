import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard.js';
import { CurrentUser } from '../Auth/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../Auth/auth.types.js';
import {
  CreateVnpayPaymentDTO,
  PaymentHistoryQueryDTO,
} from '../DTO/request/paymentDTO.js';
import { PaymentService } from '../Service/paymentService.service.js';

@ApiTags('Payment')
@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @Post('vnpay/create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  createVnpayPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateVnpayPaymentDTO,
    @Req() request: Request,
  ): Promise<{ paymentUrl: string; reference: string }> {
    return this.paymentService.createVnpayPayment(user, dto, this.getClientIp(request));
  }

  @Get('vnpay/return')
  async handleVnpayReturn(
    @Query() params: Record<string, string>,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<any> {
    try {
      const result = await this.paymentService.handleVnpayCallback(params);

      if (this.shouldRedirectToFrontend(request)) {
        response.redirect(302, this.buildPaymentResultUrl(params));
        return undefined;
      }

      return result;
    } catch (error) {
      if (this.shouldRedirectToFrontend(request)) {
        response.redirect(302, this.buildPaymentResultUrl(params));
        return undefined;
      }

      throw error;
    }
  }

  @Get('vnpay/ipn')
  async handleVnpayIpn(@Query() params: Record<string, string>): Promise<any> {
    try {
      await this.paymentService.handleVnpayCallback(params);
      return { RspCode: '00', Message: 'Confirm Success' };
    } catch {
      return { RspCode: '97', Message: 'Invalid signature or transaction' };
    }
  }

  @Get('history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  getHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: PaymentHistoryQueryDTO,
  ): Promise<any> {
    return this.paymentService.getHistory(user.id, query);
  }

  private getClientIp(request: Request): string {
    const forwarded = request.headers['x-forwarded-for'];
    const forwardedIp = Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0];

    return forwardedIp?.trim() || request.socket.remoteAddress || '127.0.0.1';
  }

  private shouldRedirectToFrontend(request: Request): boolean {
    const accept = request.headers.accept ?? '';
    return accept.includes('text/html') && !accept.includes('application/json');
  }

  private buildPaymentResultUrl(params: Record<string, string>): string {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ??
      this.configService.get<string>('CORS_ORIGINS')?.split(',')[0]?.trim() ??
      'http://localhost:5173';
    const url = new URL('/payment-result', frontendUrl);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    return url.toString();
  }
}
