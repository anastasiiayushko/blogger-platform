import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentRepository } from '../../infrastructure/comment.repository';
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
    const authorId = comment.userId;
    if (authorId !== userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }

    const result = await this.commentRepository.deleteById(commentId);
    if (result) {
      await this.commentReactionRepository.deleteAllReactionByCommentId(
        commentId,
      );
    }
  }
}
