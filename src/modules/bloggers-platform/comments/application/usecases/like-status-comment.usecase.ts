import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';
import { CommentReactionRepository } from '../../infrastructure/comment-reaction.repository';
import { CommentReaction } from '../../domain/comment-reactions.entity';
import { UsersExternalQuerySqlRepository } from '../../../../user-accounts/infrastructure/sql/external-query/users-external.query-sql-repository';
import { CommentRepository } from '../../infrastructure/comment.repository';

export class LikeStatusCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public status: LikeStatusEnum,
  ) {}
}

@CommandHandler(LikeStatusCommentCommand)
export class LikeStatusCommentHandler
  implements ICommandHandler<LikeStatusCommentCommand>
{
  constructor(
    protected commentRepository: CommentRepository,
    protected userExternalQueryRepository: UsersExternalQuerySqlRepository,
    protected commentReactionRepository: CommentReactionRepository,
  ) {}

  async execute({
    userId,
    commentId,
    status,
  }: LikeStatusCommentCommand): Promise<void> {
    await this.commentRepository.findOrNotFoundFail(commentId);

    await this.userExternalQueryRepository.findOrNotFoundFail(userId);

    const reaction =
      await this.commentReactionRepository.findByCommentAndUserId(
        commentId,
        userId,
      );
    if (!reaction && (status === LikeStatusEnum.None)) {
      return;
    }


    if (reaction) {
      const { changed } = reaction.setStatus(status);
      if (changed) {
        await this.commentReactionRepository.save(reaction);
      }
      return;
    }


    const newReaction = CommentReaction.createInstance({
      status: status,
      userId: userId,
      commentId: commentId,
    });

    await this.commentReactionRepository.save(newReaction);
    return;
  }
}
