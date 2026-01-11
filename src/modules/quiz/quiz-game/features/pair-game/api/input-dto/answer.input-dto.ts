import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString } from 'class-validator';

export class AnswerInputDto {
  @ApiProperty({ type: String })
  @Trim()
  @IsNotEmpty()
  @IsString()
  answer: string;
}
