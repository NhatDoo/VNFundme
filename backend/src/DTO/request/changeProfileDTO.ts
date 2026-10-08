import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import { UpdateProfileDataDTO } from './userDTO.js';

export class ChangeProfileDTO {
  @ApiProperty({
    example: {
      name: 'Nguyen Van B',
      phonenumber: '+84987654321',
    },
    type: UpdateProfileDataDTO,
  })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => UpdateProfileDataDTO)
  newProfileData: UpdateProfileDataDTO;
}
