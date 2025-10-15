import { Injectable } from '@nestjs/common';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { GetPostFilterContextInputDTO } from './dto/get-post-filter-context-input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Post } from '../../domain/post.entity';
import { Repository } from 'typeorm';
import { PostViewDTO } from '../../api/view-dto/post.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { toTypeOrmOrderDir } from '../../../../../core/utils/sort/to-type-orm-order-dir';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectRepository(Post) protected postRepository: Repository<Post>,
  ) {}

  async getByIdOrNotFoundFail(
    id: string,
    userId: string | null = null,
  ): Promise<PostViewDTO> {
    const post = await this.postRepository.findOne({
      where: { id: id },
      relations: {
        blog: true,
      },
    });
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    return PostViewDTO.mapToView(post);
  }

  async getAll(
    query: GetPostQueryParams,
    filterContext: GetPostFilterContextInputDTO | null = null,
    userId: string | null = null,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    const snakeNaming = new SnakeNamingStrategy();

    const orderByAttr = `p.${snakeNaming.relationName(query.sortBy)}`;
    const sortDirection = toTypeOrmOrderDir(query.sortDirection);

    const queryBuilder = this.postRepository
      .createQueryBuilder('p')
      .innerJoin('p.blog', 'b');

    if (filterContext?.blogId) {
      queryBuilder.where('p.blogId =:blogId', {
        blogId: filterContext?.blogId,
      });
    }

    const items = await queryBuilder
      .orderBy(orderByAttr, sortDirection)
      .select([
        'p.id as "id"',
        'b.id as "blogId"',
        'b.name as "blogName"',
        'p.title as "title"',
        'p.content as "content"',
        'p.short_description  as "shortDescription"',
        'p.created_at  as "createdAt"',
      ])
      .offset(query.calculateSkip())
      .limit(query.pageSize)
      .getRawMany();
    const totalCount = await queryBuilder.getCount();

    return PaginatedViewDto.mapToView({
      items: items.map((p) => PostViewDTO.mapToView(p)),
      page: query.pageNumber,
      totalCount: totalCount,
      size: query.pageSize,
    });
  }

  //   async getAll(
  //     query: GetPostQueryParams,
  //     filterContext: GetPostFilterContextInputDTO | null = null,
  //     userId: string | null = null,
  //   ): Promise<PaginatedViewDto<PostViewDTO[]>> {
  //     const params: any[] = [];
  //     let WHERE = '';
  //
  //     if (filterContext?.blogId) {
  //       params.push(filterContext.blogId);
  //       WHERE = `WHERE p."blogId" = $${params.length}`;
  //     }
  //
  //     const postsRows = await this.dataSource.query<PostWithBlogSqlRow[]>(
  //       `
  //           SELECT p.id,
  //                  p.title,
  //                  p."shortDescription",
  //                  p.content,
  //                  p."createdAt",
  //                  b.name                           AS "blogName",
  //                  b.id                             AS "blogId",
  //                  COALESCE(my.status, 'None')      AS "myStatus",
  //                  COALESCE(agg.likes, 0)           AS "likesCount",
  //                  COALESCE(agg.dislikes, 0)        AS "dislikesCount",
  //                  COALESCE(nl."newestLikes", '[]') AS "newestLikes"
  //           FROM "Posts" p
  //                    LEFT JOIN "Blogs" b ON b.id = p."blogId"
  //
  // -- статус текущего пользователя (одна строка на пост)
  //                    LEFT JOIN LATERAL (
  //               SELECT status
  //               FROM "PostReactions"
  //               WHERE "postId" = p.id
  //                 AND "userId" = $${params.length + 1}
  //               ORDER BY "createdAt" DESC
  //                   LIMIT 1
  // ) my
  //           ON TRUE
  //
  // -- агрегаты лайков/дизлайков (одна строка на пост)
  //               LEFT JOIN (
  //               SELECT "postId",
  //               COUNT (*) FILTER (WHERE status = 'Like') AS likes,
  //               COUNT (*) FILTER (WHERE status = 'Dislike') AS dislikes
  //               FROM "PostReactions"
  //               GROUP BY "postId"
  //               ) agg ON agg."postId" = p.id
  //
  // -- последние 3 лайка сразу как JSON (одна строка на пост)
  //               LEFT JOIN LATERAL (
  //               SELECT json_agg(
  //               json_build_object('addedAt', s."createdAt", 'userId', s."userId", 'login', s."login")
  //               ORDER BY s."createdAt" DESC
  //               ) AS "newestLikes"
  //               FROM (
  //               SELECT r."createdAt", r."userId", u."login"
  //               FROM "PostReactions" r
  //               JOIN "Users" u ON u.id = r."userId"
  //               WHERE r."postId" = p.id AND r."status" = 'Like'
  //               ORDER BY r."createdAt" DESC
  //               LIMIT 3
  //               ) AS s
  //               ) nl ON TRUE
  //               ${WHERE}
  //           ORDER BY "${query.sortBy}" ${query.sortDirection}
  //           OFFSET ${query.calculateSkip()} LIMIT ${query.pageSize};
  //       `,
  //       [...params, userId],
  //     );
  //
  //     const itemsMap = postsRows.map((item) => PostViewDTO.mapToView(item));
  //     const totalCount = await this.dataSource.query<[{ count: string }]>(
  //       `
  //           SELECT count(*) as count
  //           FROM public."Posts" AS p ${WHERE}
  //       `,
  //       params,
  //     );
  //
  //     return PaginatedViewDto.mapToView({
  //       items: itemsMap,
  //       page: query.pageNumber,
  //       totalCount: +totalCount?.[0]?.count,
  //       size: query.pageSize,
  //     });
  //   }
}
