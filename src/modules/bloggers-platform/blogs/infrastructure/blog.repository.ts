import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Blog, BlogPersisted } from '../domain/blog.entity';

export type BlogSqlRow = {
  id: string; // PK
  name: string; // FK
  description: string;
  websiteUrl: string;
  isMembership: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class BlogRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private async _findByIdQuery(id: string): Promise<BlogPersisted | null> {
    const SELECT_QUERY = `
        SELECT *
        FROM public."Blogs"
        WHERE id = $1

    `;

    const blogRow = await this.dataSource.query<BlogSqlRow[]>(SELECT_QUERY, [
      id,
    ]);
    if (!blogRow || blogRow.length === 0) {
      return null;
    }
    return Blog.toDomain(blogRow[0]);
  }

  async findById(id: string): Promise<Blog | null> {
    return await this._findByIdQuery(id);
  }

  /**
   * find new a blog.
   * @param {string} id - The ID of the blog to find.
   * @returns {Blog} - The ID of the find blog.
   * @throws {DomainException} - If no blog is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<BlogPersisted> {
    const blog = await this._findByIdQuery(id);
    if (!blog) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    return blog;
  }

  /**
   * Delete a blog by ID.
   * @param {string} id - The ID of the blog to delete.
   * @returns {boolean} - Result.deleteCount.

   */
  async delete(id: string): Promise<boolean> {
    const DELETE_QUERY = `
        DELETE
        FROM public."Blogs"
        WHERE id = $1
    `;
    const result = await this.dataSource.query<[[], { count: number }]>(
      DELETE_QUERY,
      [id],
    );

    return !!result?.[1].count;
  }

  /**
   * Save smart object.
   */
  private async update(blog: Blog): Promise<BlogSqlRow> {
    const UPDATE_QUERY = `
        UPDATE public."Blogs"
        SET name=$1,
            description=$2,
            "websiteUrl"=$3,
            "updatedAt"=NOW()
        WHERE public."Blogs".id = $4 RETURNING *;
    `;
    const updateRow = await this.dataSource.query<BlogSqlRow[]>(UPDATE_QUERY, [
      blog.name,
      blog.description,
      blog.websiteUrl,
      blog.id,
    ]);

    return updateRow[0];
  }

  private async insert(blog: Blog): Promise<BlogSqlRow> {
    const INSERT_QUERY = `
        INSERT INTO public."Blogs"
            (name, description, "websiteUrl", "isMembership")
        VALUES ($1, $2, $3, $4) RETURNING *;
    `;
    const insertRow = await this.dataSource.query<BlogSqlRow[]>(INSERT_QUERY, [
      blog.name,
      blog.description,
      blog.websiteUrl,
      blog.isMembership,
    ]);

    return insertRow[0];
  }

  async save(blog: Blog): Promise<BlogPersisted> {
    let blogRow: BlogSqlRow;
    if (blog.id) {
      blogRow = await this.update(blog);
    } else {
      blogRow = await this.insert(blog);
    }
    if (!blogRow) {
      throw new Error('Insert blog failed');
    }

    return Blog.toDomain(blogRow);
  }
}
