import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { Question } from '../../domain/question.entity';
import { questionBodyConstraints } from '../../domain/question.constrains';
import {
  ArrayMinSize,
  IsArray,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { validateDtoOrFail } from '../../../../../core/validate/validate-dto-or-fail';

export class CreateQuestionCommand extends Command<{ questionId: string }> {
  @MinLength(questionBodyConstraints.minLength)
  @MaxLength(questionBodyConstraints.maxLength)
  body: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMinSize(1)
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
