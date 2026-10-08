import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateVnpayPaymentDTO {
  @ApiProperty({ example: '4a5ea432-61e2-4a59-bb61-42bd66e093a1' })
  @IsUUID()
  campaignId: string;

  @ApiProperty({ example: 100000 })
  @IsInt()
  @Min(1000)
  @Max(9999999999)
  amount: number;

  @ApiProperty({ enum: ['vn', 'en'], required: false, default: 'vn' })
  @IsOptional()
  @IsIn(['vn', 'en'])
  locale?: 'vn' | 'en';

  @ApiProperty({ example: 'VNPAYQR', required: false })
  @IsOptional()
  @IsString()
  bankCode?: string;
}

export class PaymentHistoryQueryDTO {
  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}
