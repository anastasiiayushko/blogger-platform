import { Trim } from '../../../../core/decorators/transform/trim';
import { IsEmail } from 'class-validator';

export class EmailInputDto {
  @Trim()
  @IsEmail()
  email: string;
}
