import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateCategoryDTO {
  @ApiProperty({ example: 'Giao duc' })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'Cac chien dich ho tro giao duc', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}

export class UpdateCategoryDTO {
  @ApiProperty({ example: 'Giao duc va hoc bong', required: false })
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  name?: string;

  @ApiProperty({ example: 'Cac chien dich ho tro giao duc', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
