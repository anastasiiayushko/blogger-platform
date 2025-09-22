import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { Post, PostPersistedType } from '../domain/post.entity';
import { DataSource } from 'typeorm';

export type PostSqlRow = {
  id: string;
  blogId: string;
  title: string;
  content: string;
  shortDescription: string;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PostRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private async insert(post: Post): Promise<PostSqlRow> {
    const INSERT_QUERY = `
        INSERT INTO public."Posts"("blogId", title, "shortDescription", content)
        VALUES ($1, $2, $3, $4) RETURNING *;
    `;

    const postRow = await this.dataSource.query<PostSqlRow[]>(INSERT_QUERY, [
      post.blogId,
      post.title,
      post.shortDescription,
      post.content,
    ]);
    return postRow[0];
  }

  private async update(post: Post): Promise<PostSqlRow> {
    const UPDATE_QUERY = `
        UPDATE public."Posts"
        SET "blogId"           = $1,
            title              = $2,
            "shortDescription" = $3,
            content            = $4,
            "updatedAt"        = NOW()
        WHERE public."Posts".id = $5 RETURNING *;
    `;
    const postRow = await this.dataSource.query<PostSqlRow[]>(UPDATE_QUERY, [
      post.blogId,
      post.title,
      post.shortDescription,
      post.content,
      post.id,
    ]);
    return postRow[0];
  }

  async save(post: Post): Promise<PostPersistedType> {
    let result: PostSqlRow;
    if (post.id) {
      result = await this.update(post);
    } else {
      result = await this.insert(post);
    }
    if (!result) {
      throw new Error('result set after dml (insert or update) not existing');
    }

    return Post.toDomain(result);
  }

  private async _findById(id: string): Promise<PostPersistedType | null> {
    const postRow = await this.dataSource.query<PostSqlRow[]>(
      `   SELECT p.id, p."blogId", p.title, p."shortDescription", p.content, p."createdAt"
          FROM public."Posts" as p
          WHERE p.id = $1;
      `,
      [id],
    );
    return postRow?.length ? Post.toDomain(postRow[0]) : null;
  }

  async findById(id: string): Promise<PostPersistedType | null> {
    return this._findById(id);
  }

  async getByIdOrNotFoundFail(id: string): Promise<PostPersistedType> {
    const post = await this._findById(id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    return post;
  }


  async deleteById(id: string): Promise<boolean> {
    const DELETE_QUERY = `
        DELETE
        FROM public."Posts" as p
        WHERE p.id = $1;
    `;
    const result = await this.dataSource.query<[[], { count: number }]>(
      DELETE_QUERY,
      [id],
    );
    return !!result?.[1]?.count;
  }
}
