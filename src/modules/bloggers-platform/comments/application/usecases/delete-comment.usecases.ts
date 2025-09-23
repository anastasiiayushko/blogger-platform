import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentOdmRepository } from '../../infrastructure/comment.odm-repository';
import { Types } from 'mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentRepository } from '../../infrastructure/comment.repository';

export class DeleteCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(protected commentRepository: CommentRepository) {}

  async execute({ commentId, userId }: DeleteCommentCommand): Promise<void> {
    //::TODO ДОБАВИТЬ УДАЛЕНИЕ РЕАКЦИЙ
    const comment = await this.commentRepository.findOrNotFoundFail(commentId);
    const authorId = comment.userId;
    if (authorId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }
    await this.commentRepository.deleteById(commentId);
  }
}
