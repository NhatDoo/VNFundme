import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateFundUsageReportDTO {
  @ApiProperty({ example: 'Mua sach va do dung hoc tap dot 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(200)
  title: string;

  @ApiProperty({ example: 'Da mua sach giao khoa, vo va dung cu hoc tap cho 50 em.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(3000)
  description: string;

  @ApiProperty({ example: 5000000 })
  @IsNumber()
  @IsPositive()
  amountUsed: number;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  @IsDateString()
  usedAt: string;
}

export class PaginationQueryDTO {
  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsString()
  limit?: string;
}
