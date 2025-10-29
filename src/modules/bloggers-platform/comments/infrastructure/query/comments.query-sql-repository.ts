import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentViewDTO } from '../mapper/comment.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';

export type CommentWithReactionSqlRow = {
  id: string;
  content: string;
  commentatorId: string;
  commentatorLogin: string;
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusEnum;
  createdAt: Date;
};

@Injectable()
export class CommentsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getByIdOrNotFoundFail(
    commentId: string,
    userId: string | null = null,
  ): Promise<CommentViewDTO> {
    const SQL_QUERY = `
        SELECT c.id,
               c.content,
               c."createdAt",
               c."userId"                     as "commentatorId",
               u."login"                      AS "commentatorLogin",
               COALESCE(r."likesCount", 0)    as "likesCount",
               COALESCE(r."dislikesCount", 0) as "dislikesCount",
               COALESCE(my.status, 'None')    as "myStatus"

        FROM "Comments" AS c
                 JOIN "Users" AS u ON u.id = c."userId"
                 LEFT JOIN (SELECT "commentId",
                                   COUNT(*) FILTER (WHERE status = '${LikeStatusEnum.Like}') AS "likesCount", COUNT(*) FILTER (WHERE status = '${LikeStatusEnum.Dislike}') AS "dislikesCount"
                            FROM "CommentReactions"
                            GROUP BY "commentId") AS r ON r."commentId" = c."id"
                 LEFT JOIN "CommentReactions" AS my ON my."commentId" = $1 AND my."userId" = $2
        WHERE c.id = $1;
    `;
    const result = await this.dataSource.query<CommentWithReactionSqlRow[]>(
      SQL_QUERY,
      [commentId, userId],
    );
    if (!Array.isArray(result) || result.length === 0) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    return CommentViewDTO.mapToView(result[0]);
  }

  async getAll(
    query: GetCommentsQueryParams,
    filterContext: { postId: string },
    userId: string | null = null,
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    const FILTER_QUERY = `
        SELECT c.id,
               c.content,
               c."createdAt",
               u."id"                         AS "commentatorId",
               u."login"                      AS "commentatorLogin",
               COALESCE(r."likesCount", 0)    AS "likesCount",
               COALESCE(r."dislikesCount", 0) AS "dislikesCount",
               COALESCE(my."status", 'None')    AS "myStatus"
        FROM "Comments" AS c
                 JOIN "Users" AS u ON u.id = c."userId"
                 LEFT JOIN (SELECT "commentId",
                                   COUNT(*) FILTER(WHERE status='${LikeStatusEnum.Like}') AS "likesCount", 
                                   COUNT(*) FILTER(WHERE status='${LikeStatusEnum.Dislike}') AS "dislikesCount"
                            FROM "CommentReactions"
                            GROUP BY "commentId") AS r ON r."commentId" = c."id"
                 LEFT JOIN "CommentReactions" my
                           ON my."commentId" = c.id AND my."userId" = $2
        WHERE "postId" = $1
    `;

    const commentRows = await this.dataSource.query<
      CommentWithReactionSqlRow[]
    >(
      `
      ${FILTER_QUERY}
      ORDER BY "${query.sortBy}" ${query.sortDirection}
      LIMIT ${query.pageSize}
      OFFSET ${query.calculateSkip()}
    `,
      [filterContext.postId, userId],
    );

    const totalCount = await this.dataSource.query<[{ count: string }]>(
      `
          SELECT COUNT(*)
          FROM "Comments"
          WHERE "postId" = $1;
      `,
      [filterContext.postId],
    );

    const commentsView = commentRows.map((comment) =>
      CommentViewDTO.mapToView(comment),
    );
    return PaginatedViewDto.mapToView({
      items: commentsView,
      page: query.pageNumber,
      totalCount: +totalCount?.[0]?.count,
      size: +query.pageSize,
    });
  }
}
