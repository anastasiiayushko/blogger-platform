import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import {
  GetCommentsQueryParams,
  SortByComment,
} from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';
import { Comment } from '../../domain/comment.entity';
import { CommentReaction } from '../../domain/comment-reactions.entity';
import { PostQuerySortByEnum } from '../../../posts/api/input-dto/get-post-query-params.input-dto';
import { toTypeOrmOrderDir } from '../../../../../core/utils/sort/to-type-orm-order-dir';

export type CommentWithReactionSqlRow = {
  id: string;
  content: string;
  userId: string;
  userLogin: string;
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusEnum;
  createdAt: string;
};

@Injectable()
export class CommentsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private commonReactionSubQuery(
    userId: string | null = null,
  ): SelectQueryBuilder<{
    comment_id: string;
    likes_count: string;
    dislikes_count: string;
    my_status: LikeStatusEnum;
  }> {
    //@ts-expect-error
    return this.dataSource
      .createQueryBuilder()
      .subQuery()
      .from(CommentReaction, 'cr1')
      .select([
        'cr1.comment_id as "comment_id"',
        `COUNT(*) FILTER ( WHERE cr1.status = 'Like'::reactions_status_enum ) AS "likes_count"`,
        `COUNT(*) FILTER ( WHERE cr1.status = 'Dislike'::reactions_status_enum ) AS "dislikes_count"`,
      ])
      .addSelect(
        `  MAX(cr1.status) FILTER  (WHERE cr1.user_id = :user_id) as "my_status"`,
      )
      .setParameter('user_id', userId)
      .groupBy('cr1.comment_id');
  }

  private baseCommentsQuery(
    userId: string | null = null,
  ): SelectQueryBuilder<Comment> {
    const reactionSubQ = this.commonReactionSubQuery(userId);

    return this.dataSource
      .getRepository(Comment)
      .createQueryBuilder('c')
      .leftJoin(`(${reactionSubQ.getQuery()})`, 'r', 'r.comment_id = c.id')
      .setParameters(reactionSubQ.getParameters())
      .leftJoin('c.user', 'u')
      .select([
        'c.id as "id"',
        'c.content as "content"',
        'c.created_at as "createdAt"',
        'c.user_id as "userId"',
        'u.login as "userLogin"',
        'CAST(COALESCE(r."likes_count", 0)AS INT) as "likesCount"',
        'CAST(COALESCE(r."dislikes_count", 0) AS INT) as "dislikesCount"',
        `COALESCE(r."my_status", 'None'::reactions_status_enum) as "myStatus"`,
      ]);
  }

  async getByIdOrNotFoundFail(
    commentId: string,
    userId: string | null = null,
  ): Promise<CommentViewDTO> {
    const comment = await this.baseCommentsQuery(userId)
      .where('c.id = :id ', { id: commentId })
      .getRawOne<CommentWithReactionSqlRow>();
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }

    return CommentViewDTO.mapToView(comment);
  }

  async getAll(
    query: GetCommentsQueryParams,
    filterContext: { postId: string },
    userId: string | null = null,
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    const COMMENT_SORT_COLUMN_MAP: Record<SortByComment, string> = {
      [SortByComment.createdAt]: 'c.created_at',
      [SortByComment.content]: 'c.content',
    };
    const orderByColumn =
      COMMENT_SORT_COLUMN_MAP[query.sortBy] ??
      COMMENT_SORT_COLUMN_MAP[PostQuerySortByEnum.createAt];

    const sortDirection = toTypeOrmOrderDir(query.sortDirection);

    const queryBuilder = this.baseCommentsQuery(userId);

    queryBuilder.where('c.post_id = :postId', { postId: filterContext.postId });

    const totalCount = await queryBuilder.clone().getCount();

    const comments = await queryBuilder
      .orderBy(orderByColumn, sortDirection)
      .limit(query.pageSize)
      .offset(query.calculateSkip())
      .getRawMany<CommentWithReactionSqlRow>();

    return PaginatedViewDto.mapToView({
      items: comments.map((c) => CommentViewDTO.mapToView(c)),
      page: query.pageNumber,
      totalCount: +totalCount,
      size: +query.pageSize,
    });
  }
}

// async getAll(
//   query: GetCommentsQueryParams,
//   filterContext: { postId: string },
// userId: string | null = null,
// ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
//   const FILTER_QUERY = `
//         SELECT c.id,
//                c.content,
//                c."createdAt",
//                u."id"                         AS "commentatorId",
//                u."login"                      AS "commentatorLogin",
//                COALESCE(r."likesCount", 0)    AS "likesCount",
//                COALESCE(r."dislikesCount", 0) AS "dislikesCount",
//                COALESCE(my."status", 'None')  AS "myStatus"
//         FROM "Comments" AS c
//                  JOIN "Users" AS u ON u.id = c."userId"
//                  LEFT JOIN (SELECT "commentId",
//                                    COUNT(*) FILTER(WHERE status='${LikeStatusEnum.Like}') AS "likesCount", COUNT(*) FILTER(WHERE status='${LikeStatusEnum.Dislike}') AS "dislikesCount"
//                             FROM "CommentReactions"
//                             GROUP BY "commentId") AS r ON r."commentId" = c."id"
//                  LEFT JOIN "CommentReactions" my
//                            ON my."commentId" = c.id AND my."userId" = $2
//         WHERE "postId" = $1
//     `;
//
//   const commentRows = await this.dataSource.query<
//     CommentWithReactionSqlRow[]
//   >(
//     `
//       ${FILTER_QUERY}
//       ORDER BY "${query.sortBy}" ${query.sortDirection}
//       LIMIT ${query.pageSize}
//       OFFSET ${query.calculateSkip()}
//     `,
//     [filterContext.postId, userId],
//   );
//
//   const totalCount = await this.dataSource.query<[{ count: string }]>(
//     `
//           SELECT COUNT(*)
//           FROM "Comments"
//           WHERE "postId" = $1;
//       `,
//     [filterContext.postId],
//   );
//
//   const commentsView = commentRows.map((comment) =>
//     CommentViewDTO.mapToView(comment),
//   );
//   return PaginatedViewDto.mapToView({
//     items: commentsView,
//     page: query.pageNumber,
//     totalCount: +totalCount?.[0]?.count,
//     size: +query.pageSize,
//   });
// }
