import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import {
  IsBoolean,
  IsDefined,
  IsUUID,
  validateOrReject,
} from 'class-validator';

export class TogglePublishQuestionCommand extends Command<void> {
  @IsUUID()
  questionId: string;

  @IsDefined() // Ensures the property is not undefined or null
  @IsBoolean() // Ensures the property is a boolean
  published: boolean;

  constructor(questionId: string, published: boolean) {
    super();
    this.questionId = questionId;
    this.published = published;
  }
}

@CommandHandler(TogglePublishQuestionCommand)
export class TogglePublishQuestionHandler
  implements ICommandHandler<TogglePublishQuestionCommand>
{
  constructor(protected questionRepository: QuestionRepository) {}

  async execute(cmd: {
    questionId: string;
    published: boolean;
  }): Promise<void> {
    await validateOrReject(cmd);

    const question = await this.questionRepository.findOrNotFoundFail(
      cmd.questionId,
    );

    question.togglePublished(cmd.published);

    await this.questionRepository.save(question);
  }
}
