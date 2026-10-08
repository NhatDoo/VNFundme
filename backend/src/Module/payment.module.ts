import { Module } from '@nestjs/common';
import { PaymentController } from '../controller/Payment.controller.js';
import { PaymentService } from '../Service/paymentService.service.js';

@Module({
  controllers: [PaymentController],
  providers: [PaymentService],
})
export class PaymentModule {}
