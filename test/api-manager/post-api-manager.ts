import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getAuthHeaderBasicTest } from '../helpers/auth/basic-auth.helper';
import { ResponseBodySuperTest } from '../e2e/type/response-super-test';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { PostInputDTO } from '../../src/modules/bloggers-platform/posts/api/input-dto/post.input-dto';
import { GetPostQueryParams } from '../../src/modules/bloggers-platform/posts/api/input-dto/get-post-query-params.input-dto';
import { PostViewDTO } from '../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { CommentInputDto } from '../../src/modules/bloggers-platform/comments/api/input-dto/comment.input-dto';
import { CommentViewDTO } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment.view-dto';
import { GetCommentsQueryParams } from '../../src/modules/bloggers-platform/comments/api/input-dto/get-comments-query-params.input-dto';
import { LikeStatusEnum } from '../../src/core/types/like-status.enum';

export class PostApiManager {
  private urlPath = '/api/posts';
  private saUrlPath = '/api/sa/posts';
  private basicAuth = getAuthHeaderBasicTest();

  constructor(private app: INestApplication) {}

  async create(
    inputDto: PostInputDTO,
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<PostViewDTO> {
    return request(this.app.getHttpServer())
      .post(`/api/sa/blogs/${inputDto.blogId}/posts`)
      .set('Authorization', basicAuth)
      .send({
        title: inputDto.title,
        shortDescription: inputDto.shortDescription,
        content: inputDto.content,
      });
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

  async findById(
    postId: string,
    assessToken: string = '',
  ): ResponseBodySuperTest<PostViewDTO> {
    return request(this.app.getHttpServer())
      .get(`${this.urlPath}/${postId}`)
      .set('Authorization', `Bearer ${assessToken}`);
  }

  async getAll(
    query: Partial<GetPostQueryParams> = {},
    assessToken: string = '',
  ): ResponseBodySuperTest<PaginatedViewDto<PostViewDTO[]>> {
    return request(this.app.getHttpServer())
      .get(this.urlPath)
      .query(query)
      .set('Authorization', `Bearer ${assessToken}`);
  }

  async deleteById(
    postId: string,
    basicAuth: string = this.basicAuth,
  ): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .delete(this.saUrlPath + '/' + postId)
      .set('Authorization', basicAuth);
  }

  async createComment(
    postId: string,
    commentInputDto: CommentInputDto,
    accessToken: string,
  ): Promise<ResponseBodySuperTest<CommentViewDTO>> {
    return request(this.app.getHttpServer())
      .post(`${this.urlPath}/${postId}/comments`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send(commentInputDto);
  }

  async createSeveralCommentsForPost(
    postId: string,
    count: number,
    accessToken: string,
  ): Promise<CommentViewDTO[]> {
    const commentsRes = await Promise.all(
      new Array(count).fill(1).map((item) => {
        return request(this.app.getHttpServer())
          .post(`${this.urlPath}/${postId}/comments`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            content: `comments created with post ${postId} content 1`,
          })
          .expect(HttpStatus.CREATED);
      }),
    );

    return commentsRes.map((res) => res.body) as CommentViewDTO[];
  }

  async getAllCommentsByPostAndQuery(
    postId: string,
    query: Partial<GetCommentsQueryParams> = {},
  ): ResponseBodySuperTest<PaginatedViewDto<CommentViewDTO[]>> {
    return request(this.app.getHttpServer())
      .get(`${this.urlPath}/${postId}/comments`)
      .query(query);
  }

  async setLikeStatus(
    postId: string,
    likeStatus: LikeStatusEnum,
    accessToken: string,
  ): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .put(`${this.urlPath}/${postId}/like-status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ likeStatus: likeStatus });
  }
}
