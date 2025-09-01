import { Injectable } from '@nestjs/common';
import { Blog } from '../../domain/blog.odm-entity';
import { BlogViewDto } from '../../api/view-dto/blog.view-dto';
import {
  BlogSortByEnum,
  GetBlogsQueryParamsInputDto,
} from '../../api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BlogSqlRow } from '../blog.repository';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';

@Injectable()
export class BlogQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private async _findByIdQuery(id: string): Promise<BlogViewDto | null> {
    const SELECT_QUERY = `
        SELECT *
        FROM public."Blogs"
        WHERE id = $1

    `;

    const blogRow = await this.dataSource.query<BlogSqlRow[]>(SELECT_QUERY, [
      id,
    ]);
    if (!blogRow || blogRow.length === 0) {
      return null;
    }
    return BlogViewDto.mapToView(blogRow[0]);
  }

  async findById(id: string): Promise<BlogViewDto | null> {
    return await this._findByIdQuery(id);
  }

  /**
   * find new a blog.
   * @param {string} id - The ID of the blog to find.
   * @returns {Blog | null} - The ID of the find blog.
   * @throws {NotFound} - If no blog is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<BlogViewDto> {
    const blog = await this._findByIdQuery(id);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Blog not found',
        extensions: [],
      });
    }
    return blog;
  }

  async getAll(
    query: GetBlogsQueryParamsInputDto,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    const allowedSortBy = Object.values(BlogSortByEnum);
    const sortBy = allowedSortBy.includes(query.sortBy)
      ? query.sortBy
      : BlogSortByEnum.createAt;
    const sortDirection =
      query.sortDirection?.toUpperCase() === SortDirection.Asc.toUpperCase()
        ? SortDirection.Asc
        : SortDirection.Desc;

    let FILTER_QUERY = ``;
    const queryParams: any[] = [];

    if (query.searchNameTerm) {
      queryParams.push(`%${query.searchNameTerm}%`);
      FILTER_QUERY += `WHERE b.name ILIKE $${queryParams.length}`;
    }

    const SELECT_QUERY = `
        SELECT b.id, b.name, b.description, b."websiteUrl", b."createdAt", b."isMembership"
        FROM public."Blogs" AS b
            ${FILTER_QUERY}
        ORDER BY "${sortBy}" ${sortDirection}
        OFFSET ${query.calculateSkip()} limit ${query.pageSize};
    `;
    const items = await this.dataSource.query<BlogSqlRow[]>(
      SELECT_QUERY,
      queryParams,
    );

    const totalResult = await this.dataSource.query<[{ total: number }]>(
      `SELECT count(b.id) as total
       FROM public."Blogs" AS b
           ${FILTER_QUERY};
      `,
      queryParams,
    );

    return PaginatedViewDto.mapToView({
      totalCount: +totalResult?.[0].total,
      size: query.pageSize,
      page: query.pageNumber,
      items: items.map((blog) => BlogViewDto.mapToView(blog)),
    });
  }
}
