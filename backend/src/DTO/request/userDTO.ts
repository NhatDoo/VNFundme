import { ApiProperty } from '@nestjs/swagger';
import {
  IsBooleanString,
  IsEmail,
  IsIn,
  IsOptional,
  IsPhoneNumber,
  IsString,
  MinLength,
} from 'class-validator';
import { UserRole, UserStatus } from '../../generated/prisma/enums.js';

const userRoles = Object.values(UserRole);
const userStatuses = Object.values(UserStatus);

export class UpdateProfileDataDTO {
  @ApiProperty({ example: 'Nguyen Van B', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiProperty({ example: 'nguyenvanb@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+84987654321', required: false })
  @IsOptional()
  @IsPhoneNumber()
  phonenumber?: string;
}

export class ListUsersQueryDTO {
  @ApiProperty({ example: 'nguyen', required: false })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({ enum: userRoles, required: false })
  @IsOptional()
  @IsIn(userRoles)
  role?: UserRole;

  @ApiProperty({ enum: userStatuses, required: false })
  @IsOptional()
  @IsIn(userStatuses)
  status?: UserStatus;

  @ApiProperty({ example: 'false', required: false })
  @IsOptional()
  @IsBooleanString()
  includeDeleted?: string;

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

export class UpdateUserRoleDTO {
  @ApiProperty({ enum: userRoles })
  @IsIn(userRoles)
  role: UserRole;
}
