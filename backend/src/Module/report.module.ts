import { Module } from '@nestjs/common';
import {
  CampaignReportController,
  ReportController,
} from '../controller/Report.controller.js';
import { ReportService } from '../Service/reportService.service.js';

@Module({
  controllers: [ReportController, CampaignReportController],
  providers: [ReportService],
})
export class ReportModule {}
