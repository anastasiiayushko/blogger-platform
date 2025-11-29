import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { Question } from '../../domain/question.entity';

export class CreateQuestionCommand extends Command<{ questionId: string }> {
  constructor(
    public body: string,
    public correctAnswers: string[],
  ) {
    super();
  }
}

@CommandHandler(CreateQuestionCommand)
export class CreateQuestionHandler
  implements ICommandHandler<CreateQuestionCommand>
{
  constructor(protected questionRepository: QuestionRepository) {}

  async execute(cmd: CreateQuestionCommand) {
    const question = Question.createInstance(cmd);
    await this.questionRepository.save(question);
    return {
      questionId: question.id,
    };
  }
}
