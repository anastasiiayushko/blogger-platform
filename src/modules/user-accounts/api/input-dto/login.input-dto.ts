import { Trim } from '../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginInputDto {
  @ApiProperty({type: String})
  @Trim()
  @IsNotEmpty()
  @IsString()
  loginOrEmail: string;

  @ApiProperty({type: String})
  @Trim()
  @IsNotEmpty()
  @IsString()
  password: string;
}
