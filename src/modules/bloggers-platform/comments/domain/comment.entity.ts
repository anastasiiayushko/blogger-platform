import { UpdateCommentDomainDto } from './dto/update-comment.domain.dto';
import { CreateCommentDomainDto } from './dto/create-comment.domain.dto';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { Post } from '../../posts/domain/post.entity';
import { User } from '../../../user-accounts/domin/user.entity';
import { CommentReaction } from './comment-reactions.entity';

@Entity()
export class Comment extends BaseOrmEntity {
  @ManyToOne(() => Post, (post) => post.id, {
    nullable: false, // комментарий без поста запрещён
    // onDelete: 'CASCADE', // на случай hard-purge если удалят пост
  })
  @JoinColumn()
  post: Post;
  @Column({ type: 'uuid', nullable: false })
  postId: string;

  @ManyToOne(() => User, (user) => user.id, {
    nullable: false, // комментарий без автора запрещён
    // onDelete: 'CASCADE', // на случай hard-purge если удалят юзера
  })
  @JoinColumn()
  user: User;
  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @OneToMany(() => CommentReaction, (cr) => cr.comment)
  reactions: CommentReaction[];

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

  isMyComment(authorId: string): boolean {
    return this.userId === authorId;
  }
}
