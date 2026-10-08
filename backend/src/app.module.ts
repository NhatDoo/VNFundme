import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { UserModule } from './Module/user.module.js';
import { CampaignModule } from './Module/campaign.module.js';
import {ConfigModule} from '@nestjs/config';
import { AuthModule } from './Module/auth.module.js';
import { PaymentModule } from './Module/payment.module.js';
import { AdminModule } from './Module/admin.module.js';
import { ReportModule } from './Module/report.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuthModule,
    UserModule,
    CampaignModule,
    PaymentModule,
    AdminModule,
    ReportModule,
    // Distributed tracing, auto-correlated logs, request/job metrics, error
    // telemetry, alarms, and more — out of the box. Sign up at https://observe.nestjs.com
    // ObserveModule.forRoot({
    //   appKey: 'YOUR_APP_KEY',
    //   appSecret: 'YOUR_APP_SECRET',
    //   serviceId: 'backend',
    // }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
