import { Trim } from '../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class AuthCodeInputDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  @IsUUID()
  code: string;
}
