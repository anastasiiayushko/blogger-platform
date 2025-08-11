import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { CommentRepository } from '../../infrastructure/comment.repository';

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users-external.query-repository';
import { LikeUpsertService } from '../../../likes/application/services/like-upsert.service';
import { LikeRepository } from '../../../likes/infrastucture/repository/like-repository';

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
    protected userExternalQueryRepository: UsersExternalQueryRepository,
    protected likeUpsertService: LikeUpsertService,
    protected likeRepository: LikeRepository,
  ) {}

  async execute({
    userId,
    commentId,
    status,
  }: LikeStatusCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findOrNotFoundFail(commentId);
    const user = await this.userExternalQueryRepository.findOrNotFoundFail(userId);

    await this.likeUpsertService.upsert({
      authorName: user.login,
      authorId: userId,
      parentId: commentId,
      status: status,
    });

    const likesCount = await this.likeRepository.getCountersByParentIdAndStatus(
      commentId,
      LikeStatusEnum.Like,
    );
    const dislikesCount =
      await this.likeRepository.getCountersByParentIdAndStatus(
        commentId,
        LikeStatusEnum.Dislike,
      );

    comment.updateLikesInfo({
      likesCount: likesCount,
      dislikesCount: dislikesCount,
    });

    await this.commentRepository.save(comment);
  }
}
