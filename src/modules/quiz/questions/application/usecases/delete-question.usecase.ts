import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { QuestionRepository } from '../../infrastructure/question.repository';
import { IsUUID } from 'class-validator';
import { validateDtoOrFail } from '../../../../../core/validate/validate-dto-or-fail';

export class DeleteQuestionCommand extends Command<void> {
  @IsUUID()
  questionId: string;

  constructor(questionId: string) {
    super();
    this.questionId = questionId;
  }
}

@CommandHandler(DeleteQuestionCommand)
export class DeleteQuestionHandler
  implements ICommandHandler<DeleteQuestionCommand>
{
  constructor(protected questionRepository: QuestionRepository) {}

  async execute(cmd: DeleteQuestionCommand): Promise<void> {
    await validateDtoOrFail(cmd);

    const question = await this.questionRepository.findOrNotFoundFail(
      cmd.questionId,
    );

    await this.questionRepository.softDelete(question.id);
    return;
  }
}
