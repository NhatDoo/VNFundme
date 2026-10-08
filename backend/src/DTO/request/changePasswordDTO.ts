import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

export class ChangePasswordDTO {
  @ApiProperty({ example: 'StrongPassword123' })
  @IsNotEmpty()
  @MinLength(15)
  oldPassword: string;

  @ApiProperty({ example: 'NewStrongPassword123' })
  @IsNotEmpty()
  @MinLength(15)
  newPassword: string;
}
