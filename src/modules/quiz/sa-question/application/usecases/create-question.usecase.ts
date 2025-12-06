import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { Question } from '../../domain/question.entity';
import { questionBodyConstraints } from '../../domain/question.constrains';
import {
  ArrayMinSize,
  IsArray, IsNotEmpty,
  IsString, Length,
  MaxLength,
  MinLength,
} from 'class-validator';
import { validateDtoOrFail } from '../../../../../core/validate/validate-dto-or-fail';

export class CreateQuestionCommand extends Command<{ questionId: string }> {
  @MinLength(questionBodyConstraints.minLength)
  @MaxLength(questionBodyConstraints.maxLength)
  body: string;

  @IsArray({ message: 'должны быть массивом' })
  @ArrayMinSize(1, { message: 'Массив ответов не может быть пустым' })
  // each: true указывает class-validator проверить КАЖДЫЙ элемент массива
  @IsString({
    each: true,
    message: 'Каждый элемент массива должен быть строкой',
  })
  // Проверяет, что КАЖДЫЙ элемент массива не является пустой строкой (не null, не undefined и длина > 0)
  @IsNotEmpty({ each: true, message: 'Строка ответа не может быть пустой.' })
  correctAnswers: string[];

  constructor(body: string, correctAnswers: string[]) {
    super();
    this.body = body;
    this.correctAnswers = correctAnswers;
  }
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionHandler
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(protected questionRepository: QuestionRepository) {}

  async execute(cmd: CreateQuestionCommand) {
    await validateDtoOrFail(cmd);

    const question = Question.createInstance(cmd);
    await this.questionRepository.save(question);
    return {
      questionId: question.id,
    };
  }
}
