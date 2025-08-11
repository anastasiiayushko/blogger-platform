import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { LikeUpsertService } from '../../../likes/application/services/like-upsert.service';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users-external.query-repository';
import { LikeRepository } from '../../../likes/infrastucture/repository/like-repository';

export class SetLikeStatusPostCommand {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly status: LikeStatusEnum,
  ) {}
}

@CommandHandler(SetLikeStatusPostCommand)
export class SetLikeStatusPostHandler
  implements ICommandHandler<SetLikeStatusPostCommand>
{
  constructor(
    protected postRepo: PostRepository,
    protected userQRepo: UsersExternalQueryRepository,
    protected likeUpsertService: LikeUpsertService,
    protected likeRepo: LikeRepository,
  ) {}

  async execute({ postId, userId, status }: SetLikeStatusPostCommand) {
    const post = await this.postRepo.getByIdOrNotFoundFail(postId);
    const user = await this.userQRepo.findOrNotFoundFail(userId);

    await this.likeUpsertService.upsert({
      parentId: postId,
      status: status,
      authorName: user.login,
      authorId: userId,
    });

    const likesCount = await this.likeRepo.getCountersByParentIdAndStatus(
      postId,
      LikeStatusEnum.Like,
    );
    const dislikesCount = await this.likeRepo.getCountersByParentIdAndStatus(
      postId,
      LikeStatusEnum.Dislike,
    );

    const newestLikes = await this.likeRepo.getNewestLikesByParentId(postId);
    post.updateExtendedLikesInfo({
      likesCount,
      dislikesCount,
      newestLikes: newestLikes.map((i) => ({
        userId: i.authorId.toString(),
        login: i.authorName,
        addedAt: i.createdAt,
      })),
    });
    await this.postRepo.save(post);
  }
}
