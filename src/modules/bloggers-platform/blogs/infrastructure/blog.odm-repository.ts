import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogDocument, BlogModelType } from '../domain/blog.odm-entity';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Types } from 'mongoose';

@Injectable()
export class BlogRepository {
  constructor(
    @InjectModel(Blog.name) private BlogModel: BlogModelType
  ) {}

  async findById(id: string): Promise<BlogDocument | null> {
    const blog = await this.BlogModel.findById(id);
    if (!blog) {
      return null;
    }
    return blog;
  }

  /**
   * find new a blog.
   * @param {string} id - The ID of the blog to find.
   * @returns {BlogDocument | null} - The ID of the find blog.
   * @throws {DomainException} - If no blog is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<BlogDocument> {
    const blog = await this.BlogModel.findById(id);
    if (!blog) {
      //TODO: replace with domain exception
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    return blog;
  }

  // /**
  //  * Create new a blog.
  //  * @param {CreateBlogDomainDto}
  //  * @returns {BlogDocument}
  //  * @throws {}
  //  */
  // create(dto: CreateBlogDomainDto): BlogDocument {
  //   return this.BlogModel.createInstance(dto);
  // }

  /**
   * Delete a blog by ID.
   * @param {string} id - The ID of the blog to delete.
   * @returns {boolean} - Result.deleteCount.

   */
  async delete(id: string): Promise<boolean> {
    const result = await this.BlogModel.deleteOne({
      _id: new Types.ObjectId(id),
    });
    return !!result.deletedCount;
  }

  /**
   * Save smart object.
   */
  async save(blog: BlogDocument) {
    await blog.save();
  }
}
