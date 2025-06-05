import { Trim } from '../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginInputDto {
  @Trim()
  @IsNotEmpty()
  @IsString()
  loginOrEmail: string;

  @Trim()
  @IsNotEmpty()
  @IsString()
  password: string;
}
