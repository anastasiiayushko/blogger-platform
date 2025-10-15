import { Injectable } from '@nestjs/common';
import { Blog } from '../../domain/blog.entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import { GetBlogsQueryParamsInputDto } from '../../api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

@Injectable()
export class BlogQueryRepository {
  constructor(
    @InjectRepository(Blog) protected blogRepository: Repository<Blog>,
  ) {}

  /**
   * find blog by id.
   * @param {string} id - The ID of the blog to find.
   * @returns {BlogViewDto | null} - The ID of the find blog.
   */
  async findById(id: string): Promise<BlogViewDto | null> {
    const blog = await this.blogRepository.findOneBy({ id: id });
    return blog ? BlogViewDto.mapToView(blog) : null;
  }

  /**
   * find blog by id or throws.
   * @param {string} id - The ID of the blog to find.
   * @returns {BlogViewDto} - The ID of the find blog.
   * @throws {NotFound} - If no blog is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this.blogRepository.findOneBy({ id: id });

    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
        extensions: [],
      });
    }
    return BlogViewDto.mapToView(blog);
  }

  /**
   * Returns all blogs with paging.
   * @param {GetBlogsQueryParamsInputDto} query - The params of the blog to filter.
   * @returns {PaginatedViewDto<BlogViewDto[]>}
   */
  async getAll(
    query: GetBlogsQueryParamsInputDto,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    let whereOptions: any[] = [];

    if (query.searchNameTerm) {
      whereOptions.push({ name: ILike(`%${query.searchNameTerm.trim()}%`) });
    }
    const items = await this.blogRepository.find({
      where: whereOptions,
      select: {
        id: true,
        name: true,
        description: true,
        websiteUrl: true,
        createdAt: true,
        isMembership: true,
      },
      order: {
        [query.sortBy]: query.sortDirection,
      },
      skip: query.calculateSkip(),
      take: query.pageSize,
    });

    const totalCount = await this.blogRepository.count({
      where: whereOptions,
    });

    return PaginatedViewDto.mapToView({
      totalCount: totalCount,
      size: query.pageSize,
      page: query.pageNumber,
      items: items.map((b) => BlogViewDto.mapToView(b)),
    });
  }
}
