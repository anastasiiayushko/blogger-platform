import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { validateDtoOrFail } from '../../../../../core/validate/validate-dto-or-fail';
import {
  ArrayMinSize,
  IsArray, IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';
import { questionBodyConstraints } from '../../domain/question.constrains';

export class UpdateQuestionCommand extends Command<void> {
  @IsUUID()
  questionId: string;

  @MinLength(questionBodyConstraints.minLength)
  @MaxLength(questionBodyConstraints.maxLength)
  body: string;

  @IsArray({ message: 'Теги должны быть массивом' })
  @ArrayMinSize(1, { message: 'Массив ответов не может быть пустым' })
  // each: true указывает class-validator проверить КАЖДЫЙ элемент массива
  @IsString({
    each: true,
    message: 'Каждый элемент массива должен быть строкой',
  })
  // Проверяет, что КАЖДЫЙ элемент массива не является пустой строкой (не null, не undefined и длина > 0)
  @IsNotEmpty({ each: true, message: 'Строка ответа не может быть пустой.' })

  correctAnswers: string[];

  constructor(questionId: string, body: string, correctAnswers: string[]) {
    super();
    this.body = body;
    this.correctAnswers = correctAnswers;
    this.questionId = questionId;
  }
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionHandler
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(protected questionRepository: QuestionRepository) {}

  async execute(cmd: UpdateQuestionCommand): Promise<void> {
    await validateDtoOrFail(cmd);
    const question = await this.questionRepository.findOrNotFoundFail(
      cmd.questionId,
    );

    question.updateQuestion({
      body: cmd.body,
      correctAnswers: cmd.correctAnswers,
    });

    await this.questionRepository.save(question);
    return;
  }
}
