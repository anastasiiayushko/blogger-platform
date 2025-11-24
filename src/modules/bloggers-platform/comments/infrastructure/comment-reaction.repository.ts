import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CommentReaction } from '../domain/comment-reactions.entity';
import { LikeStatusEnum } from '../../../../core/types/like-status.enum';
import { CommentRepository } from './comment.repository';

export class CommentReactionSqlRow {
  id: string;
  commentId: string;
  userId: string;
  status: LikeStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CommentReactionRepository {
  constructor(
    @InjectRepository(CommentReaction)
    protected commentReactionRepository: Repository<CommentReaction>,
  ) {}

  async findByCommentAndUserId(
    commentId: string,
    userId: string,
  ): Promise<CommentReaction | null> {
    return await this.commentReactionRepository.findOne({
      where: {
        commentId: commentId,
        userId: userId,
      },
    });
  }

  async save(reaction: CommentReaction): Promise<void> {
    await this.commentReactionRepository.save(reaction);
  }

  async findOrNotFoundFail(
    commentId: string,
    userId: string,
  ): Promise<CommentReaction> {
    const reaction = await this.findByCommentAndUserId(commentId, userId);
    if (!reaction) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment reaction not found',
      });
    }
    return reaction;
  }

  async softDeleteAllReactionByCommentId(commentId: string): Promise<void> {
    await this.commentReactionRepository
      .createQueryBuilder('')
      .softDelete()
      .where('commentId =:commentId', { commentId })
      .execute();
  }
}

// export class CommentReactionRepository {
//   constructor(@InjectDataSource() protected dataSource: DataSource) {}
//
//   private async insert(dto: {
//     commentId: string;
//     userId: string;
//     status: LikeStatusEnum;
//   }): Promise<CommentReactionSqlRow> {
//     const INSERT_QUERY = `
//         INSERT INTO public."CommentReactions"("commentId", "userId", status)
//         VALUES ($1, $2, $3) RETURNING *;
//     `;
//
//     const reactionRow = await this.dataSource.query<CommentReactionSqlRow[]>(
//       INSERT_QUERY,
//       [dto.commentId, dto.userId, dto.status],
//     );
//     return reactionRow[0];
//   }
//
//   private async update(dto: {
//     id: string;
//     status: LikeStatusEnum;
//   }): Promise<CommentReactionSqlRow> {
//     const UPDATE_QUERY = `
//         UPDATE public."CommentReactions" AS r
//         SET status      = $1,
//             "updatedAt" = NOW()
//         WHERE r."id" = $2 RETURNING *;
//     `;
//     const reactionRow = await this.dataSource.query<CommentReactionSqlRow[]>(
//       UPDATE_QUERY,
//       [dto.status, dto.id],
//     );
//     return reactionRow[0];
//   }
//
//   async findByCommentAndUserId(
//     commentId: string,
//     userId: string,
//   ): Promise<CommentReactionPersistedType | null> {
//     const reactionRow = await this.dataSource.query<CommentReactionSqlRow[]>(
//       `
//           SELECT id, "commentId", "userId", status, "createdAt", "updatedAt"
//           FROM public."CommentReactions" AS r
//           WHERE r."commentId" = $1
//             AND r."userId" = $2;
//       `,
//       [commentId, userId],
//     );
//     if (!Array.isArray(reactionRow) || !reactionRow.length) {
//       return null;
//     }
//     return CommentReaction.toDomain(reactionRow[0]);
//   }
//
//   async save(
//     reaction: CommentReactionUnionType,
//   ): Promise<CommentReactionPersistedType> {
//     let result: CommentReactionSqlRow;
//
//     if (reaction.isNew()) {
//       const dto = CommentReaction.toPrimitive<BaseEntityNewType>(reaction);
//       result = await this.insert({
//         commentId: dto.commentId,
//         userId: dto.userId,
//         status: dto.status,
//       });
//     } else {
//       const dto =
//         CommentReaction.toPrimitive<BaseEntityPersistedType>(reaction);
//       result = await this.update({
//         status: dto.status,
//         id: dto.id,
//       });
//     }
//     if (!result) {
//       throw new Error('result set after dml (insert or update) not existing');
//     }
//
//     return CommentReaction.toDomain(result);
//   }
//
//   async findOrNotFoundFail(
//     commentId: string,
//     userId: string,
//   ): Promise<CommentReactionPersistedType> {
//     const reaction = await this.findByCommentAndUserId(commentId, userId);
//     if (!reaction) {
//       throw new DomainException({
//         code: DomainExceptionCode.NotFound,
//         message: 'Comment reaction not found',
//       });
//     }
//     return reaction;
//   }
//
//   async deleteAllReactionByCommentId(commentId: string): Promise<void> {
//     await this.dataSource.query(
//       `
//         DELETE
//         FROM public."CommentReactions" AS r
//         WHERE r."commentId" = $1;
//
//     `,
//       [commentId],
//     );
//   }
// }
