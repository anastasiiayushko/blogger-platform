import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';
import { Entity, Column, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { Post } from '../../posts/domain/post.entity';

@Entity()
export class Blog extends BaseOrmEntity {
  @Column({ type: 'text', collation: 'C' })
  name: string;
  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'text' })
  websiteUrl: string;

  @Column({ type: 'boolean', default: false })
  isMembership: boolean;

  @OneToMany(() => Post, (post) => post.blog)
  posts: Post[];

  static createInstance(dto: CreateBlogDomainDto): Blog {
    const blog = new Blog();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    return blog;
  }

  updateBlog(dto: CreateBlogDomainDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}
