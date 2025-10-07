import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { UsersExternalQuerySqlRepository } from '../../../../user-accounts/infrastructure/sql/external-query/users-external.query-sql-repository';
import { PostReactionRepository } from '../../infrastructure/post-reaction.repository';
import { PostReaction } from '../../domain/post-reactions.entity';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';

export class LikeStatusPostCommand {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly status: LikeStatusEnum,
  ) {}
}

@CommandHandler(LikeStatusPostCommand)
export class LikeStatusPostHandler
  implements ICommandHandler<LikeStatusPostCommand>
{
  constructor(
    protected postRepository: PostRepository,
    protected usersExternalQuerySqlRepository: UsersExternalQuerySqlRepository,
    protected postReactionRepository: PostReactionRepository,
  ) {}

  async execute({ postId, userId, status }: LikeStatusPostCommand) {
    await this.postRepository.getByIdOrNotFoundFail(postId);
    await this.usersExternalQuerySqlRepository.findOrNotFoundFail(userId);

    const reaction = await this.postReactionRepository.findByPostAndUserId(
      postId,
      userId,
    );

    if (!reaction && status === LikeStatusEnum.None) {
      return;
    }

    if (reaction) {
      const { changed } = reaction.setStatus(status);
      if (changed) {
        await this.postReactionRepository.save(reaction);
      }
      return;
    }

    const newReaction = PostReaction.createInstance({
      status: status,
      userId: userId,
      postId: postId,
    });

    await this.postReactionRepository.save(newReaction);
    return;
  }
}
