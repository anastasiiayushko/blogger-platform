import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';
import { CommentReactionRepository } from '../../infrastructure/comment-reaction.repository';
import { CommentReaction } from '../../domain/comment-reactions.entity';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { UserExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/user-external.query-repository';

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
    protected userExternalQueryRepository: UserExternalQueryRepository,
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
    if (!reaction && status === LikeStatusEnum.None) {
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
