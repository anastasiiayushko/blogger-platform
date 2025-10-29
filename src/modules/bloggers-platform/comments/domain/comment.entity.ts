import { UpdateCommentDomainDto } from './dto/update-comment.domain.dto';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { Post } from '../../posts/domain/post.entity';
import { User } from '../../../user-accounts/domin/user.entity';

@Entity()
export class Comment extends BaseOrmEntity {
  @ManyToOne(() => Post, (post) => post.id, {
    nullable: false, // комментарий без поста запрещён
    onDelete: 'CASCADE', // на случай hard-purge
  })
  @JoinColumn()
  post: Post;
  @Column({ type: 'uuid', nullable: false })
  postId: string;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false, // комментарий без автора запрещён
    onDelete: 'CASCADE', // на случай hard-purge
  })
  @JoinColumn()
  user: User;
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @Column({ type: 'text', nullable: false })
  content: string;

  static createInstance(dto: CreateCommentDomainDto): Comment {
    const comment: Comment = new Comment();
    comment.postId = dto.postId;
    comment.userId = dto.userId;
    comment.content = dto.content;
    return comment;
  }

  updateContent(dto: UpdateCommentDomainDto): void {
    this.content = dto.content;
  }
}
