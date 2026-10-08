import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsPhoneNumber, MinLength } from 'class-validator';

export class RegisterDTO {
  @ApiProperty({ example: 'nguyenvana@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassword123' })
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '+84901234567' })
  @IsNotEmpty()
  @MinLength(10)
  @IsPhoneNumber()
  phonenumber: string;
}
