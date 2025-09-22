import { Injectable } from '@nestjs/common';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { GetPostFilterContextInputDTO } from './dto/get-post-filter-context-input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { PostPersistedType } from '../../domain/post.entity';
import { DataSource } from 'typeorm';
import { PostViewDTO } from '../../api/view-dto/post.view-dto';
import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

type PostWithBlogSqlRow = PostPersistedType & { blogName: string };

@Injectable()
export class PostQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDTO> {
    const SELECT_QUERY = `
        SELECT p.id,
               p.title,
               p."shortDescription",
               p.content,
               p."blogId",
               p."createdAt",
               b.name as "blogName"
        FROM public."Posts" AS p
                 LEFT JOIN public."Blogs" as b ON p."blogId" = b.id
        WHERE p.id = $1;
    `;
    const postRow = await this.dataSource.query<PostWithBlogSqlRow[]>(
      SELECT_QUERY,
      [id],
    );
    if (!postRow || !postRow?.length) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    return PostViewDTO.mapToView(postRow[0], LikeStatusEnum.None);
  }

  async getAll(
    query: GetPostQueryParams,
    filterContext: GetPostFilterContextInputDTO | null = null,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    const params: any[] = [];
    let WHERE = '';

    if (filterContext?.blogId) {
      params.push(filterContext.blogId);
      WHERE = `WHERE p."blogId" = $${params.length}`;
    }

    const postsRows = await this.dataSource.query<PostWithBlogSqlRow[]>(
      `
          SELECT p.id,
                 p.title,
                 p."shortDescription",
                 p.content,
                 p."blogId",
                 p."createdAt",
                 b.name as "blogName"
          FROM public."Posts" AS p
                   LEFT JOIN public."Blogs" as b ON p."blogId" = b.id
              ${WHERE}
          ORDER BY "${query.sortBy}" ${query.sortDirection}
          OFFSET ${query.calculateSkip()} LIMIT ${query.pageSize};
      `,
      params,
    );

    const itemsMap =  postsRows.map((item) => PostViewDTO.mapToView(item, LikeStatusEnum.None),)
    const totalCount = await this.dataSource.query<[ { count: string }]>(
      `
          SELECT count(*) as count
          FROM public."Posts" AS p ${WHERE}
      `,
      params,
    );

    return PaginatedViewDto.mapToView({
      items: itemsMap,
      page: query.pageNumber,
      totalCount: +totalCount?.[0]?.count,
      size: query.pageSize,
    });
  }
}
