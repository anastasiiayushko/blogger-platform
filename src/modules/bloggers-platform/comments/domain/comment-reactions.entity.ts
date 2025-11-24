import { LikeStatusEnum } from '../../../../core/types/like-status.enum';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { User } from '../../../user-accounts/domin/user.entity';
import { Comment } from './comment.entity';

type BaseCommentReaction = {
  commentId: string;
  userId: string;
  status: LikeStatusEnum;
};

@Entity('comment_reaction')
export class CommentReaction extends BaseOrmEntity {
  @ManyToOne(() => Comment, (c) => c.reactions, {})
  @JoinColumn()
  comment: Comment;
  @Column({ type: 'uuid', nullable: false })
  commentId: string;

  @ManyToOne(() => User, (u) => u.reactions, {})
  @JoinColumn()
  user: User;
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({
    type: 'enum',
    enum: LikeStatusEnum,
    default: LikeStatusEnum.None,
  })
  status: LikeStatusEnum;

  static createInstance(dto: BaseCommentReaction): CommentReaction {
    const comment = new CommentReaction();
    comment.commentId = dto.commentId;
    comment.userId = dto.userId;
    comment.status = dto.status;
    return comment;
  }

  setStatus(toStatus: LikeStatusEnum): { changed: boolean } {
    if (this.status !== toStatus) {
      this.status = toStatus;
      return { changed: true };
    }
    return { changed: false };
  }
}
