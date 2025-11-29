import { ApiProperty } from '@nestjs/swagger';
import { Trim } from '../../../../../core/decorators/transform/trim';
import { questionBodyConstraints } from '../../domain/question.constrains';
import { IsArray, IsString, MaxLength, MinLength } from 'class-validator';
import { CreateQuestionPayload } from '../../domain/dto/create-question-domain.input-dto';

export class QuestionInputDto implements CreateQuestionPayload {
  @ApiProperty({
    description: 'Body current question',
    minLength: questionBodyConstraints.minLength,
    maxLength: questionBodyConstraints.maxLength,
    type: 'string',
  })
  @Trim()
  @MinLength(questionBodyConstraints.minLength)
  @MaxLength(questionBodyConstraints.maxLength)
  body: string;

  @ApiProperty({
    description: `All variants of possible correct answers for current questions Examples: ['6', 'six', 'шесть', 'дофига']`,
  })
  @IsArray()
  @IsString({ each: true })
  correctAnswers: string[];
}
