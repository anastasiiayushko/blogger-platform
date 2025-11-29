import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';

export class UpdateQuestionCommand extends Command<void> {
  constructor(
    public readonly questionId: string,
    public body: string,
    public correctAnswers: string[],
  ) {
    super();
  }
}

@CommandHandler(UpdateQuestionCommand)
export class UpdateQuestionHandler
  implements ICommandHandler<UpdateQuestionCommand>
{
  constructor(protected questionRepository: QuestionRepository) {}

  async execute(cmd: UpdateQuestionCommand): Promise<void> {
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
