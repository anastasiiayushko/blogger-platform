import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentReactionRepository } from '../../infrastructure/comment-reaction.repository';

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
  constructor(
    protected commentRepository: CommentRepository,
    protected commentReactionRepository: CommentReactionRepository,
  ) {}

  async execute({ commentId, userId }: DeleteCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findOrNotFoundFail(commentId);
    const isNotMyComment = !comment.isMyComment(userId);
    if (isNotMyComment) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }
    //::TODO в каком слои нужно создавать транзакцию

    await this.commentRepository.softDeleteById(commentId);
    await this.commentReactionRepository.softDeleteAllReactionByCommentId(commentId);

    return;
  }
}
