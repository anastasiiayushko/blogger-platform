import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../../../core/decorators/transform/trim';
import { questionBodyConstraints } from '../../domain/question.constrains';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { IUpSertQuestionPayload } from '../../domain/dto/up-sert-question-input.dto';

export class QuestionInputDto implements IUpSertQuestionPayload {
  @ApiProperty({
    description: 'Body current question',
    minLength: questionBodyConstraints.minLength,
    maxLength: questionBodyConstraints.maxLength,
    type: 'string',
    required: true,
  })
  @Trim()
  @MinLength(questionBodyConstraints.minLength)
  @MaxLength(questionBodyConstraints.maxLength)
  body: string;

  @ApiProperty({
    description: `All variants of possible correct answers for current questions Examples: ['6', 'six', 'шесть', 'дофига']`,
    required: true,
  })
  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
  correctAnswers: string[];
}
