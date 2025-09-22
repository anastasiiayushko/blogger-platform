import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { CommentViewDTO } from '../mapper/comment.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export type CommentWithReactionSqlRow = {
  id: string;
  content: string;
  authorId: string;
  authorLogin: string;
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
               c."userId"                     as "authorId",
               u."login"                      AS "authorLogin",
               COALESCE(r."likesCount", 0)    as "likesCount",
               COALESCE(r."dislikesCount", 0) as "dislikesCount",
               --COALESCE(my.type, 'None')      as "myStatus"

        FROM "Comments" AS c
                 INNER JOIN "Users" AS u
                            ON u.id = c."userId"
                 LEFT JOIN (SELECT "commentId",
                                   COUNT(*) FILTER (WHERE type = '${LikeStatusEnum.Like}') AS "likesCount",
                                    COUNT(*) FILTER (WHERE type = '${LikeStatusEnum.Dislike}') AS "dislikesCount"
                            FROM "CommentReactions"
                            GROUP BY "commentId") AS r ON r."commentId" = c."id"
--                  LEFT JOIN (SELECT type,
--                             FROM "CommentReactions"
--                             WHERE "commentId" = $1
--                               AND "userId" = $2) AS my ON $2 IS NOT NULL
        WHERE "commentId" = $1;
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
}
