import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MinLength,
  MaxLength,
} from 'class-validator';
import { CampaignStatus } from '../../generated/prisma/enums.js';

const campaignStatuses = Object.values(CampaignStatus);

export class CreateCampaignDTO {
  @ApiProperty({ example: 'Ho tro hoc sinh vung cao' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @ApiProperty({
    example: 'Gay quy mua sach vo va dung cu hoc tap cho hoc sinh vung cao.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  description: string;

  @ApiProperty({ example: 50000000 })
  @IsNumber()
  @IsPositive()
  target: number;
  
  @ApiProperty({ example: '4a5ea432-61e2-4a59-bb61-42bd66e093a1', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class UpdateCampaignDTO {
  @ApiProperty({ example: 'Ho tro hoc sinh vung cao', required: false })
  @IsOptional()
  @IsString()
  @MinLength(5)
  title?: string;

  @ApiProperty({
    example: 'Cap nhat noi dung, muc tieu va doi tuong nhan ho tro.',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(20)
  description?: string;

  @ApiProperty({ example: 75000000, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  target?: number;

  @ApiProperty({ example: '4a5ea432-61e2-4a59-bb61-42bd66e093a1', required: false })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class CreateCampaignUpdateDTO {
  @ApiProperty({ example: 'Da mua sach giao khoa dot 1' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  title: string;

  @ApiProperty({
    example: 'Da phan bo sach giao khoa va do dung hoc tap cho 50 hoc sinh.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  content: string;

  @ApiProperty({ example: 5000000, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  amountUsed?: number;
}

export class ApproveCampaignDTO {
  @ApiProperty({ example: 'Thong tin campaign da day du.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reviewNote?: string;
}

export class RejectCampaignDTO {
  @ApiProperty({ example: 'Can bo sung ke hoach su dung quy va tai lieu minh chung.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  @MaxLength(1000)
  reviewNote: string;
}

export class ListCampaignQueryDTO {
  @ApiProperty({ example: 'hoc sinh', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: campaignStatuses, required: false })
  @IsOptional()
  @IsIn(campaignStatuses)
  status?: CampaignStatus;

  @ApiProperty({
    example: '4a5ea432-61e2-4a59-bb61-42bd66e093a1',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  creatorId?: string;

  @ApiProperty({
    example: '4a5ea432-61e2-4a59-bb61-42bd66e093a1',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiProperty({ example: '1', required: false })
  @IsOptional()
  @IsString()
  page?: string;

  @ApiProperty({ example: '10', required: false })
  @IsOptional()
  @IsString()
  limit?: string;

  @ApiProperty({ example: 'createdAt', required: false })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiProperty({ example: 'desc', required: false })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc';
}
