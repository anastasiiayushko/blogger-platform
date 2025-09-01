import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getAuthHeaderBasicTest } from '../common-helpers';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { ResponseBodySuperTest } from '../../type/response-super-test';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';
import { PostInputDTO } from '../../../src/modules/bloggers-platform/posts/api/input-dto/post.input-dto';
import { GetPostQueryParams } from '../../../src/modules/bloggers-platform/posts/api/input-dto/get-post-query-params.input-dto';
import { PostViewDTO } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';

export class PostApiManager {
  private urlPath = '/api/posts';
  private saUrlPath = '/api/sa/posts';
  private basicAuth = getAuthHeaderBasicTest();

  constructor(private app: INestApplication) {}

  async create(
    inputDto: PostInputDTO,
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<BlogViewDto> {
    return request(this.app.getHttpServer())
      .post(this.saUrlPath)
      .set('Authorization', basicAuth)
      .send(inputDto);
  }

  async update(
    postId: string,
    inputDto: PostInputDTO,
    basicAuth: string = this.basicAuth,
  ) {
    return request(this.app.getHttpServer())
      .put(`${this.saUrlPath}/${postId}`)
      .set('Authorization', basicAuth)
      .send(inputDto);
  }

  async findById(postId: string) {
    return request(this.app.getHttpServer()).get(`${this.urlPath}/${postId}`);
  }

  async getAll(
    query: Partial<GetPostQueryParams> = {},
  ): ResponseBodySuperTest<PaginatedViewDto<PostViewDTO[]>> {
    return request(this.app.getHttpServer()).get(this.urlPath).query(query);
  }

  async getById(postId: string): ResponseBodySuperTest<PostViewDTO> {
    return request(this.app.getHttpServer()).get(this.urlPath + '/' + postId);
  }

  async deleteById(
    postId: string,
    basicAuth: string = this.basicAuth,
  ): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .delete(this.saUrlPath + '/' + postId)
      .set('Authorization', basicAuth);
  }
}
