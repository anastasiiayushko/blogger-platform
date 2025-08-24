import { Trim } from '../../../../core/decorators/transform/trim';
import { IsEmail } from 'class-validator';

export class EmailInputModelDto {
  @Trim()
  @IsEmail()
  email: string;
}
