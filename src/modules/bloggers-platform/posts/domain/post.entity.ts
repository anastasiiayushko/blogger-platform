import { CreatePostDomainDto } from './dto/create-post.domain.dto';
import { Column, Entity, ManyToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { Blog } from '../../blogs/domain/blog.entity';
import { UpdatePostDomainDto } from './dto/update-post.domain.dto';

@Entity()
export class Post extends BaseOrmEntity {
  @Column({ type: 'text', nullable: false, collation: 'C' })
  title: string;

  @Column({ type: 'text', nullable: false, collation: 'C' })
  shortDescription: string;

  @Column({ type: 'text', nullable: false, collation: 'C' })
  content: string;

  // Хранит FK (blogId) — владеющая сторона
  @ManyToOne(() => Blog, (b) => b.posts, {
    nullable: false, // пост без блога запрещён
  })
  blog: Blog;

  @Column({ type: 'uuid', nullable: false })
  blogId: string; // синхронен с FK колонкой

  static createInstance(dto: CreatePostDomainDto): Post {
    const post = new Post();
    post.title = dto.title;
    post.content = dto.content;
    post.shortDescription = dto.shortDescription;
    post.blogId = dto.blogId;
    return post;
  }

  updatePost(inputDto: UpdatePostDomainDto): void {
    this.title = inputDto.title;
    this.shortDescription = inputDto.shortDescription;
    this.content = inputDto.content;
  }
}
