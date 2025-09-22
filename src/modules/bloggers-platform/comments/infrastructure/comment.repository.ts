import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import {
  Comment,
  CommentNewType,
  CommentPersistedType,
} from '../domain/comment.entity';

export class CommentSqlRow {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CommentRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private async insert(dto: {
    postId: string;
    userId: string;
    content: string;
  }): Promise<CommentSqlRow> {
    const INSERT_QUERY = `
        INSERT INTO public."Comments"("postId", "userId", content)
        VALUES ($1, $2, $3) RETURNING *;
    `;

    const commentRow = await this.dataSource.query<CommentSqlRow[]>(
      INSERT_QUERY,
      [dto.postId, dto.userId, dto.content],
    );
    return commentRow[0];
  }

  private async update(dto: {
    id: string;
    content: string;
  }): Promise<CommentSqlRow> {
    const UPDATE_QUERY = `
        UPDATE public."Comments"
        SET content     = $1,
            "updatedAt" = NOW()
        WHERE public."Comments".id = $2 RETURNING *;
    `;
    const commentRow = await this.dataSource.query<CommentSqlRow[]>(
      UPDATE_QUERY,
      [dto.content, dto.id],
    );
    return commentRow[0];
  }

  async findById(id: string): Promise<CommentPersistedType | null> {
    const commentRows = await this.dataSource.query(
      `
          SELECT id, "postId", "userId", content, "createdAt", "updatedAt"
          FROM public."Comments"
          WHERE id = $1;
      `,
      [id],
    );
    if (!Array.isArray(commentRows) || !commentRows.length) {
      return null;
    }
    return Comment.toDomain(commentRows[0]);
  }

  async save(
    comment: CommentPersistedType | CommentNewType,
  ): Promise<CommentPersistedType> {
    let result: CommentSqlRow;

    if (Comment.isNew(comment)) {
      const dto = Comment.toPrimitive(comment);
      result = await this.insert({
        postId: dto.postId,
        content: dto.content,
        userId: dto.userId,
      });
    } else {
      const dto = Comment.toPrimitive(comment);
      result = await this.update({
        id: dto.id,
        content: dto.content,
      });
    }
    if (!result) {
      throw new Error('result set after dml (insert or update) not existing');
    }

    return Comment.toDomain(result);
  }

  async deleteById(id: string): Promise<boolean> {
    // const result = await
    return false;
  }

  async findOrNotFoundFail(id: string): Promise<CommentPersistedType> {
    const comment = await this.findById(id);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }
    return comment;
  }
}
