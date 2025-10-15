import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { Blog } from '../domain/blog.entity';
import { Repository } from 'typeorm';

export type BlogSqlRow = {
  id: string; // PK
  name: string; // FK
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BlogRepository {
  constructor(
    @InjectRepository(Blog) protected blogRepository: Repository<Blog>,
  ) {}

  async findById(id: string): Promise<Blog | null> {
    return this.blogRepository.findOneBy({ id: id });
  }

  /**
   * find new a blog.
   * @param {string} id - The ID of the blog to find.
   * @returns {Blog} - The ID of the find blog.
   * @throws {DomainException} - If no blog is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<Blog> {
    const blog = await this.blogRepository.findOneBy({ id: id });
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    return blog;
  }

  /**
   * Delete a blog by ID.
   * @param {string} id - The ID of the blog to delete.
   * @returns {boolean} - Result.deleteCount.

   */
  async softDeleteById(id: string): Promise<boolean> {
    const result = await this.blogRepository.softDelete(id);
    return !!result.raw;
  }

  async save(blog: Blog): Promise<Blog> {
    return await this.blogRepository.save(blog);
  }
}
