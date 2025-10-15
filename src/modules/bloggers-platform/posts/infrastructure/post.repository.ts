import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../domain/post.entity';
import { Repository } from 'typeorm';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post) protected postRepository: Repository<Post>,
  ) {}

  async save(post: Post): Promise<Post> {
    return await this.postRepository.save(post);
  }

  async findById(id: string): Promise<Post | null> {
    return this.postRepository.findOneBy({ id: id });
  }

  async getByIdOrNotFoundFail(id: string): Promise<Post> {
    const post = await this.postRepository.findOneBy({ id: id });
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    return post;
  }

  async softDeleteById(id: string): Promise<boolean> {
    const result = await this.postRepository.softDelete({ id: id });
    return !!result?.raw;
  }

  async softDeleteByBlogId(blogId: string): Promise<boolean> {
    const result = await this.postRepository.softDelete({ blogId: blogId });
    return !!result?.raw;
  }
}
