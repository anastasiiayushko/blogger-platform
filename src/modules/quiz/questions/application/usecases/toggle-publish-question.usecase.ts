import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class TogglePublishQuestionCommand extends Command<void> {
  constructor(
    public questionId: string,
    public published: boolean,
  ) {
    super();
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
    const question = await this.questionRepository.findOrNotFoundFail(
      cmd.questionId,
    );

    question.togglePublished(cmd.published);

    await this.questionRepository.save(question);
  }
}
