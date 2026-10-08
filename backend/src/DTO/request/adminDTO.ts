import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaymentStatus } from '../../generated/prisma/enums.js';

const paymentStatuses = Object.values(PaymentStatus);

export class ListTransactionsQueryDTO {
  @ApiProperty({ enum: paymentStatuses, required: false })
  @IsOptional()
  @IsIn(paymentStatuses)
  status?: PaymentStatus;

  @ApiProperty({ example: 'VN20260917', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}
