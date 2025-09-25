import { Injectable } from '@nestjs/common';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { GetPostFilterContextInputDTO } from './dto/get-post-filter-context-input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { PostPersistedType } from '../../domain/post.entity';
import { DataSource } from 'typeorm';
import { PostViewDTO } from '../../api/view-dto/post.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';

export type PostWithBlogSqlRow = PostPersistedType & {
  blogName: string;
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusEnum;
  newestLikes: any
};

@Injectable()
export class PostQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getByIdOrNotFoundFail(
    id: string,
    userId: string | null = null,
  ): Promise<PostViewDTO> {
    const SELECT_QUERY = `

        SELECT p.id,
               p.title,
               p."shortDescription",
               p.content,
               p."createdAt",
               b.name                           AS "blogName",
               b.id                             AS "blogId",
               COALESCE(my.status, 'None')      AS "myStatus",
               COALESCE(agg.likes, 0)           AS "likesCount",
               COALESCE(agg.dislikes, 0)        AS "dislikesCount",
               COALESCE(nl."newestLikes", '[]') AS "newestLikes"
        FROM "Posts" p
                 LEFT JOIN "Blogs" b ON b.id = p."blogId"

-- статус текущего пользователя (одна строка на пост)
                 LEFT JOIN LATERAL (
            SELECT status
            FROM "PostReactions"
            WHERE "postId" = p.id
              AND "userId" = $2
            ORDER BY "createdAt" DESC
                LIMIT 1
) my
        ON TRUE

-- агрегаты лайков/дизлайков (одна строка на пост)
            LEFT JOIN (
            SELECT "postId",
            COUNT (*) FILTER (WHERE status = 'Like') AS likes,
            COUNT (*) FILTER (WHERE status = 'Dislike') AS dislikes
            FROM "PostReactions"
            GROUP BY "postId"
            ) agg ON agg."postId" = p.id

-- последние 3 лайка сразу как JSON (одна строка на пост)
            LEFT JOIN LATERAL (
            SELECT json_agg(
            json_build_object('addedAt', s."createdAt", 'userId', s."userId", 'login', s."login")
            ORDER BY s."createdAt" DESC
            ) AS "newestLikes"
            FROM (
            SELECT r."createdAt", r."userId", u."login"
            FROM "PostReactions" r
            JOIN "Users" u ON u.id = r."userId"
            WHERE r."postId" = p.id AND r."status" = 'Like'
            ORDER BY r."createdAt" DESC
            LIMIT 3
            ) AS s
            ) nl ON TRUE
        
        WHERE p.id = $1;


    `

    const SELECT_QUERY_old1 = `
        SELECT p.id,
               b.id                                                  as "blogId",
               string_agg(p.title, '')                               as title,
               Max(p."shortDescription")                             as "shortDescription",
               Max(p.content)                                        as content,
               string_agg(p."createdAt", '')                         as createdAt,
               Max(b.name)                                           as "blogName",
               string_agg(COALESCE(my.status, 'None'), '')           as "myStatus",
               Max(COALESCE(r.likes, 0))                             as "likesCount",
               Max(COALESCE(r.dislikes, 0))                          AS "dislikesCount",
               COALESCE(
                       json_agg(
                               json_build_object(
                                       'addedAt', x."createdAt",
                                       'userId', x."userId",
                                       'login', x."login"
                               )
                       ) FILTER(WHERE x."userId" IS NOT NULL), '[]') AS "newestLikes"
        FROM "Posts" AS p
                 LEFT JOIN "Blogs" AS b ON b.id = p."blogId"
                 LEFT JOIN "PostReactions" AS my
                           ON my."userId" = $2 AND my."postId" = p.id
                 LEFT JOIN (SELECT "postId",
                                   COUNT(*) FILTER(WHERE status = 'Like') as "likes", COUNT(*) FILTER (WHERE status = 'Dislike') as "dislikes"
                            FROM "PostReactions"
                            GROUP BY "postId") AS r ON r."postId" = p.id
                 LEFT JOIN LATERAL (
            SELECT r."createdAt",
                   r."userId",
                   u."login"
            FROM "PostReactions" r
                     JOIN "Users" u ON u.id = r."userId"
            WHERE r."postId" = p.id
              AND r."status" = 'Like'
            ORDER BY r."createdAt" DESC
                LIMIT 3 ) AS x
        ON TRUE
        WHERE p.id = $1
        GROUP BY p.id, b.id;

    `;
    const SELECT_QUERY_OLD = `
        SELECT p.id,
               p.title,
               p."shortDescription",
               p.content,
               p."createdAt",
               b.name                      as "blogName",
               b.id                        as "blogId",
               COALESCE(my.status, 'None') as "myStatus",
               COALESCE(r.likes, 0)        as "likesCount",
               COALESCE(r.dislikes, 0)     AS "dislikesCount"
        --COALESCE(json_agg(l.* ORDER BY l."addedAt" DESC) FILTER(WHERE l IS NOT NULL), '[]') AS newestLikes
        FROM "Posts" AS p
                 LEFT JOIN "Blogs" AS b ON b.id = p."blogId"
                 LEFT JOIN "PostReactions" AS my ON my."userId" = $2 AND my."postId" = p.id
                 LEFT JOIN (SELECT "postId",
                                   COUNT(*) FILTER(WHERE status = 'Like') as "likes", COUNT(*) FILTER (WHERE status = 'Dislike') as "dislikes"
                            FROM "PostReactions"
                            GROUP BY "postId") AS r ON r."postId" = p.id
        WHERE p.id = $1;
    `;
    const postRow = await this.dataSource.query<PostWithBlogSqlRow[]>(
      SELECT_QUERY,
      [id, userId],
    );
    if (!postRow || !postRow?.length) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    return PostViewDTO.mapToView(postRow[0]);
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

    const itemsMap = postsRows.map((item) => PostViewDTO.mapToView(item));
    const totalCount = await this.dataSource.query<[{ count: string }]>(
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
