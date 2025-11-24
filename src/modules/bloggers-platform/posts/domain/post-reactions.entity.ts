import { LikeStatusEnum } from '../../../../core/types/like-status.enum';
import { Column, Entity, JoinColumn, ManyToOne, Unique } from 'typeorm';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { Post } from './post.entity';
import { User } from '../../../user-accounts/domin/user.entity';

type BaseReaction = {
  postId: string;
  userId: string;
  status: LikeStatusEnum;
};

@Entity('post_reaction')
@Unique(['user', 'post']) // чтобы один пользователь не ставил несколько реакций на один пост
export class PostReaction extends BaseOrmEntity {
  @Column({
    type: 'enum',
    enum: LikeStatusEnum,
    default: LikeStatusEnum.None,
  })
  status: string;

  @ManyToOne(() => Post, (p) => p.reactions)
  @JoinColumn()
  post: Post;

  @Column({ type: 'uuid', nullable: false })
  postId: string;

  @ManyToOne(() => User, (u) => u.postReactions)
  @JoinColumn()
  user: User;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  static createInstance(dto: BaseReaction): PostReaction {
    const reaction = new PostReaction();
    reaction.userId = dto.userId;
    reaction.postId = dto.postId;
    reaction.status = dto.status;
    return reaction;
  }

  setStatus(status: LikeStatusEnum): { changed: boolean } {
    if (this.status !== status) {
      this.status = status;
      return { changed: true };
    }
    return { changed: false };
  }
}
