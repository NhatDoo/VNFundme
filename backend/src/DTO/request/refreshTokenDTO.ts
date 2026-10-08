import { ApiProperty } from '@nestjs/swagger';
import { IsJWT, IsNotEmpty } from 'class-validator';

export class RefreshTokenDTO {
  @ApiProperty()
  @IsNotEmpty()
  @IsJWT()
  refreshToken: string;
}
