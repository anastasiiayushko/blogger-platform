import { ApiProperty, OmitType } from '@nestjs/swagger';
import { questionBodyConstraints } from '../../domain/question.constrains';
import { CreateQuestionCommand } from '../../application/usecases/create-question.usecase';
import { Trim } from '../../../../../core/decorators/transform/trim';

export class QuestionInputDto extends OmitType(CreateQuestionCommand, [
  'body',
  'correctAnswers',
]) {
  @ApiProperty({
    description: 'Body current question',
    minLength: questionBodyConstraints.minLength,
    maxLength: questionBodyConstraints.maxLength,
    type: 'string',
    required: true,
  })
  // трансформация работает только если объект прошёл через class-transformer
  // (plainToInstance / ValidationPipe с transform: true)
  @Trim()
  body: string;

  @ApiProperty({
    description: `All variants of possible correct answers for current questions Examples: ['6', 'six', 'шесть', 'дофига']`,
    required: true,
  })
  correctAnswers: string[];
}
