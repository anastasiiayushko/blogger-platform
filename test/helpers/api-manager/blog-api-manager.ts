import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import request from 'supertest';
import { delay, getAuthHeaderBasicTest } from '../common-helpers';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { ResponseBodySuperTest } from '../../type/response-super-test';
import { GetBlogsQueryParamsInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';
import { PostInputDTO } from '../../../src/modules/bloggers-platform/posts/api/input-dto/post.input-dto';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from '../../../src/modules/bloggers-platform/posts/domain/post.constraints';
import { PostViewDTO } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { BlogPostInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog-post.input-dto';
import { LikeStatusEnum } from '../../../src/modules/bloggers-platform/likes/domain/like-status.enum';
import { GetPostQueryParams } from '../../../src/modules/bloggers-platform/posts/api/input-dto/get-post-query-params.input-dto';

export class BlogApiManager {
  private urlPath = '/api/blogs';
  private saUrlPath = '/api/sa/blogs';
  private basicAuth = getAuthHeaderBasicTest();

  constructor(private app: INestApplication) {}

  async create(
    inputDto: BlogInputDto,
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<BlogViewDto> {
    return request(this.app.getHttpServer())
      .post(this.saUrlPath)
      .set('Authorization', basicAuth)
      .send(inputDto);
  }

  async update(
    blogId: string,
    inputDto: BlogInputDto,
    basicAuth: string = this.basicAuth,
  ) {
    return request(this.app.getHttpServer())
      .put(`${this.saUrlPath}/${blogId}`)
      .set('Authorization', basicAuth)
      .send(inputDto);
  }

  async findById(blogId: string) {
    return request(this.app.getHttpServer()).get(`${this.urlPath}/${blogId}`);
  }

  async createServerlPostsForBlog(blogId: string, postsCount: number) {
    const responses: ResponseBodySuperTest<PostViewDTO>[] = [];

    for (let i = 0; i < postsCount; i++) {
      const titleLen = Math.floor(
        Math.random() * postTitleConstraints.maxLength - 1,
      );
      const descLen = Math.floor(
        Math.random() * postShortDescConstraints.maxLength - 1,
      );
      const contentLen = Math.floor(
        Math.random() * postContentConstraints.maxLength - 1,
      );
      await delay(60);
      const body: Omit<PostInputDTO, 'blogId'> = {
        title: `post num${i}`,
        shortDescription: `description ${i}`,
        content: `content: ${i}`,
      };
      const res = request(this.app.getHttpServer())
        .post(`${this.saUrlPath}/${blogId}/posts`)
        .set('Authorization', this.basicAuth)
        .send(body);
      responses.push(res);
    }

    const resolved = await Promise.all(responses);

    const posts: PostViewDTO[] = resolved.map((response) => {
      expect(response.status).toBe(HttpStatus.CREATED);
      expect(response.body).toMatchObject<PostViewDTO>({
        id: expect.any(String),
        title: expect.any(String),
        shortDescription: expect.any(String),
        content: expect.any(String),
        createdAt: expect.any(String),
        blogId: expect.any(String),
        blogName: expect.any(String),
        extendedLikesInfo: {
          likesCount: 0,
          dislikesCount: 0,
          myStatus: LikeStatusEnum.None,
          newestLikes: [],
        },
      });
      return response.body as unknown as PostViewDTO;
    });

    return posts;
  }

  async createSeveralBlogs(
    blogCount: number,
    basicAuth: string = this.basicAuth,
  ): Promise<BlogViewDto[]> {
    const responses: ResponseBodySuperTest<BlogViewDto>[] = [];

    for (let i = 0; i < blogCount; i++) {
      await delay(60);
      const body = {
        name: `blog-name-${i}`,
        description: 'blog-description',
        websiteUrl: `https://blog-name-${i}domain.com`,
      };
      const res = this.create(body, basicAuth);
      responses.push(res);
    }

    const resolved = await Promise.all(responses);

    const blogs: BlogViewDto[] = resolved.map((response) => {
      expect(response.status).toBe(HttpStatus.CREATED);
      return response.body as unknown as BlogViewDto;
    });

    return blogs;
  }

  async getAllBlogs(
    query: Partial<GetBlogsQueryParamsInputDto> = {},
  ): ResponseBodySuperTest<PaginatedViewDto<BlogViewDto[]>> {
    return request(this.app.getHttpServer()).get(this.urlPath).query(query);
  }

  async saGetAllBlogs(
    query: Partial<GetBlogsQueryParamsInputDto> = {},
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<PaginatedViewDto<BlogViewDto[]>> {
    return request(this.app.getHttpServer())
      .get(this.saUrlPath)
      .query(query)
      .set('Authorization', basicAuth);
  }

  async getById(blogId: string): ResponseBodySuperTest<BlogViewDto> {
    return request(this.app.getHttpServer()).get(this.urlPath + '/' + blogId);
  }

  async deleteById(
    blogId: string,
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<void> {
    return request(this.app.getHttpServer())
      .delete(this.saUrlPath + '/' + blogId)
      .set('Authorization', basicAuth);
  }

  async createPostForBlog(
    blogId: string,
    inputModel: BlogPostInputDto,
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<PostViewDTO> {
    return request(this.app.getHttpServer())
      .post(this.saUrlPath + '/' + blogId + '/posts')
      .send(inputModel)
      .set('Authorization', basicAuth);
  }

  async updatePostForBlog(
    parameters: { blogId: string; postId: string },
    inputModel: BlogPostInputDto,
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<PostViewDTO> {
    return request(this.app.getHttpServer())
      .put(
        this.saUrlPath +
          '/' +
          parameters.blogId +
          '/posts/' +
          parameters.postId,
      )
      .send(inputModel)
      .set('Authorization', basicAuth);
  }

  async getPostsWithPagingByParamBlogId(
    blogId: string,
    query: Partial<GetPostQueryParams> = {},
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<PaginatedViewDto<PostViewDTO[]>> {
    return request(this.app.getHttpServer())
      .get(this.saUrlPath + '/' + blogId + '/posts')
      .query(query)
      .set('Authorization', basicAuth);
  }

  async deletePostIdForBlog(
    parameters: { blogId: string; postId: string },
    basicAuth: string = this.basicAuth,
  ): ResponseBodySuperTest<PostViewDTO> {
    return request(this.app.getHttpServer())
      .delete(
        this.saUrlPath +
          '/' +
          parameters.blogId +
          '/posts/' +
          parameters.postId,
      )
      .set('Authorization', basicAuth);
  }
}
