import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Blog, BlogModelType } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { GetBlogsQueryParamsInputDto } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery } from 'mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectModel(Blog.name) private readonly BlogModel: BlogModelType,
  ) {}

  async findById(id: string): Promise<BlogViewDto | null> {
    const blog = await this.BlogModel.findById(id);
    if (!blog) {
      return null;
    }
    return BlogViewDto.mapToView(blog);
  }

  /**
   * find new a blog.
   * @param {string} id - The ID of the blog to find.
   * @returns {BlogDocument | null} - The ID of the find blog.
   * @throws {NotFoundException} - If no blog is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.BlogModel.findById(id);
    if (!blog) {
      //TODO: replace with domain exception
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
        extensions: [],
      });
    }
    return BlogViewDto.mapToView(blog);
  }

  async getAll(
    query: GetBlogsQueryParamsInputDto,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const filter: FilterQuery<Blog> = {};

    if (query.searchNameTerm) {
      filter.name = { $regex: query.searchNameTerm, $options: 'i' };
    }

    const items = await this.BlogModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.BlogModel.countDocuments(filter);

    return PaginatedViewDto.mapToView({
      totalCount: totalCount,
      size: query.pageSize,
      page: query.pageNumber,
      items: items.map((blog) => BlogViewDto.mapToView(blog)),
    });
  }
}
