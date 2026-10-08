import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../Auth/guards/jwt-auth.guard.js';
import { RolesGuard } from '../Auth/guards/roles.guard.js';
import { CurrentUser } from '../Auth/decorators/current-user.decorator.js';
import { Roles } from '../Auth/decorators/roles.decorator.js';
import type { AuthenticatedUser } from '../Auth/auth.types.js';
import { UserRole } from '../generated/prisma/enums.js';
import { CreateFundUsageReportDTO, PaginationQueryDTO } from '../DTO/request/reportDTO.js';
import { ReportService } from '../Service/reportService.service.js';

@ApiTags('Transparency')
@Controller('transparency')
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Get('overview')
  getOverview(): Promise<any> {
    return this.reportService.getOverview();
  }

  @Get('campaigns/:id')
  getCampaignSummary(@Param('id') id: string): Promise<any> {
    return this.reportService.getCampaignSummary(id);
  }

  @Get('campaigns/:id/donations')
  findDonations(
    @Param('id') id: string,
    @Query() query: PaginationQueryDTO,
  ): Promise<any> {
    return this.reportService.findPublicDonations(id, query);
  }

  @Get('campaigns/:id/fund-usage')
  findFundUsageReports(
    @Param('id') id: string,
    @Query() query: PaginationQueryDTO,
  ): Promise<any> {
    return this.reportService.findFundUsageReports(id, query);
  }
}

@ApiTags('Campaign reports')
@ApiBearerAuth('access-token')
@Controller('campaign')
export class CampaignReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post(':id/fund-usage-reports')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ORGANIZER, UserRole.ADMIN)
  createFundUsageReport(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFundUsageReportDTO,
  ): Promise<any> {
    return this.reportService.createFundUsageReport(id, user, dto);
  }
}
