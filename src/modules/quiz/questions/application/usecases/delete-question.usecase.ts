import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class DeleteQuestionCommand extends Command<void> {
  constructor(public readonly questionId: string) {
    super();
  }
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionHandler
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(protected questionRepository: QuestionRepository) {}

  async execute(cmd: DeleteQuestionCommand): Promise<void> {
    const question = await this.questionRepository.findOrNotFoundFail(
      cmd.questionId,
    );

    await this.questionRepository.softDelete(question.id);
    return;
  }
}
