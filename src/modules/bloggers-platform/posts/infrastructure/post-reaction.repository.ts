import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

import {
  BaseEntityNewType,
  BaseEntityPersistedType,
} from '../../../../core/types/base-entity.type';
import { LikeStatusEnum } from '../../../../core/types/like-status.enum';
import {
  PostReaction,
  PostReactionPersistedType,
  PostReactionUnionType,
} from '../domain/post-reactions.entity';

export class PostReactionSqlRow {
  id: string;
  postId: string;
  userId: string;
  status: LikeStatusEnum;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class PostReactionRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private async insert(dto: {
    postId: string;
    userId: string;
    status: LikeStatusEnum;
  }): Promise<PostReactionSqlRow> {
    const INSERT_QUERY = `
        INSERT INTO public."PostReactions"("postId", "userId", status)
        VALUES ($1, $2, $3) RETURNING *;
    `;

    const reactionRow = await this.dataSource.query<PostReactionSqlRow[]>(
      INSERT_QUERY,
      [dto.postId, dto.userId, dto.status],
    );
    return reactionRow[0];
  }

  private async update(dto: {
    id: string;
    status: LikeStatusEnum;
  }): Promise<PostReactionSqlRow> {
    const UPDATE_QUERY = `
        UPDATE public."PostReactions" AS r
        SET status      = $1,
            "updatedAt" = NOW()
        WHERE r."id" = $2 RETURNING *;
    `;
    const reactionRow = await this.dataSource.query<PostReactionSqlRow[]>(
      UPDATE_QUERY,
      [dto.status, dto.id],
    );
    return reactionRow[0];
  }

  async findByPostAndUserId(
    postId: string,
    userId: string,
  ): Promise<PostReactionPersistedType | null> {
    const reactionRow = await this.dataSource.query<PostReactionSqlRow[]>(
      `
          SELECT id, "postId", "userId", status, "createdAt", "updatedAt"
          FROM public."PostReactions" AS r
          WHERE r."postId" = $1
            AND r."userId" = $2;
      `,
      [postId, userId],
    );
    if (!Array.isArray(reactionRow) || !reactionRow.length) {
      return null;
    }
    return PostReaction.toDomain(reactionRow[0]);
  }

  async save(
    reaction: PostReactionUnionType,
  ): Promise<PostReactionPersistedType> {
    let result: PostReactionSqlRow;

    if (reaction.isNew()) {
      const dto = PostReaction.toPrimitive<BaseEntityNewType>(reaction);
      result = await this.insert({
        postId: dto.postId,
        userId: dto.userId,
        status: dto.status,
      });
    } else {
      const dto = PostReaction.toPrimitive<BaseEntityPersistedType>(reaction);
      result = await this.update({
        status: dto.status,
        id: dto.id,
      });
    }
    if (!result) {
      throw new Error('result set after dml (insert or update) not existing');
    }

    return PostReaction.toDomain(result);
  }

  async findOrNotFoundFail(
    commentId: string,
    userId: string,
  ): Promise<PostReactionPersistedType> {
    const reaction = await this.findByPostAndUserId(commentId, userId);
    if (!reaction) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment reaction not found',
      });
    }
    return reaction;
  }

  async deleteAllReactionByPostId(commentId: string): Promise<void> {
    await this.dataSource.query(`
        DELETE
        FROM public."PostReactions" AS r
        WHERE r."postId" = $1;

    `);
  }
}
