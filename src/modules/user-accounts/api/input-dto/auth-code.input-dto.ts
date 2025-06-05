import { Trim } from '../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString } from 'class-validator';

export class AuthCodeInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  code: string;
}
