import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommentViewDTO } from '../mapper/comment.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';
import { Comment } from '../../domain/comment.entity';

export type CommentWithReactionSqlRow = {
  id: string;
  content: string;
  commentatorId: string;
  commentatorLogin: string;
  likesCount: number;
  dislikesCount: number;
  myStatus: LikeStatusEnum;
  createdAt: string;
};

@Injectable()
export class CommentsQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async getByIdOrNotFoundFail(
    commentId: string,
    userId: string | null = null,
  ): Promise<CommentViewDTO> {
    const comment = await this.dataSource
      .getRepository(Comment)
      .createQueryBuilder('c')
      .leftJoin('c.user', 'u')
      .where('c.id = :id ', { id: commentId })
      // .where("c.id = :id AND c.user_id = :user_id", { id: commentId, user_id: userId })
      .select([
        'c.id as "id"',
        'c.content as "content"',
        'c.user_id as "commentatorId"',
        'c.created_at as "createdAt"',
        'u.login as "commentatorLogin"',
      ])
      .getRawOne();
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
    const FILTER_QUERY = `
        SELECT c.id,
               c.content,
               c."createdAt",
               u."id"                         AS "commentatorId",
               u."login"                      AS "commentatorLogin",
               COALESCE(r."likesCount", 0)    AS "likesCount",
               COALESCE(r."dislikesCount", 0) AS "dislikesCount",
               COALESCE(my."status", 'None')  AS "myStatus"
        FROM "Comments" AS c
                 JOIN "Users" AS u ON u.id = c."userId"
                 LEFT JOIN (SELECT "commentId",
                                   COUNT(*) FILTER(WHERE status='${LikeStatusEnum.Like}') AS "likesCount", COUNT(*) FILTER(WHERE status='${LikeStatusEnum.Dislike}') AS "dislikesCount"
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
