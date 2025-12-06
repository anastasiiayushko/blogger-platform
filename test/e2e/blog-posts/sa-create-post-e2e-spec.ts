import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../../api-manager/blog-api-manager';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { BlogPostInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog-post.input-dto';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from '../../../src/modules/bloggers-platform/posts/domain/post.constraints';
import { PostViewDTO } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { randomUUID } from 'crypto';
import { BlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import { ApiErrorResultType } from '../type/response-super-test';
import { LikeStatusEnum } from '../../../src/core/types/like-status.enum';
import { generateRandomStringForTest } from '../../util/random/generate-random-text';

describe('Create new post for specific blog /blogs/:blogId/posts', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let blogApiManger: BlogApiManager;
  let mainBlog: BlogViewDto;
  const blogFakeData: BlogInputDto = {
    name: 'fake blog',
    description: 'this blog about fake data',
    websiteUrl: 'https://test-website-url.com',
  };
  const postFakeData: BlogPostInputDto = {
    title: 'fake title',
    shortDescription: 'this post about fake data',
    content: 'This post about fake big data',
  };

  beforeAll(async () => {
    const init = await setupNextAppHttp();
    app = init.app;
    blogApiManger = new BlogApiManager(app);
    const createdBlogRes = await blogApiManger.create(blogFakeData, basicAuth);

    expect(createdBlogRes.status).toBe(HttpStatus.CREATED);
    mainBlog = createdBlogRes.body;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be status 201 and Returns the newly created post', async () => {
    const postResponse = await blogApiManger.createPostForBlog(
      mainBlog.id,
      postFakeData,
      basicAuth,
    );

    expect(postResponse.status).toBe(HttpStatus.CREATED);
    expect(postResponse.body).toEqual<PostViewDTO>({
      id: expect.any(String),
      title: postFakeData.title,
      shortDescription: postFakeData.shortDescription,
      content: postFakeData.content,
      createdAt: expect.any(String),
      blogId: mainBlog.id,
      blogName: mainBlog.name,
      extendedLikesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatusEnum.None,
        newestLikes: [],
      },
    });
  });

  it("Should be status 404 If specific blog doesn't exists", async () => {
    const postResponse = await blogApiManger.createPostForBlog(
      randomUUID(),
      postFakeData,
      basicAuth,
    );
    expect(postResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should be status 401 Unauthorized', async () => {
    const postResponse = await blogApiManger.createPostForBlog(
      mainBlog.id,
      postFakeData,
      getAuthHeaderBasicTest('admin:no12345'),
    );
    expect(postResponse.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should be status 400  If the inputModel has incorrect values', async () => {
    const fields = {
      title: '  ',
      content: ' ',
      shortDescription: '',
    };
    for (const field in fields) {
      const value: string = fields[field];
      const postTitleResponse =
        await blogApiManger.createPostForBlog<ApiErrorResultType>(
          mainBlog.id,
          {
            ...postFakeData,
            [field]: value,
          },
          basicAuth,
        );

      expect(postTitleResponse.status).toBe(HttpStatus.BAD_REQUEST);

      expect(postTitleResponse.body.errorsMessages).toEqual([
        { field: field, message: expect.any(String) },
      ]);
    }

    const postResponse =
      await blogApiManger.createPostForBlog<ApiErrorResultType>(
        mainBlog.id,
        {} as BlogPostInputDto,
        basicAuth,
      );
    expect(postResponse.status).toBe(HttpStatus.BAD_REQUEST);

    expect(postResponse.body).toMatchObject<ApiErrorResultType>({
      errorsMessages: expect.arrayContaining([
        { field: 'title', message: expect.any(String) },
        { field: 'content', message: expect.any(String) },
        { field: 'shortDescription', message: expect.any(String) },
      ]),
    });
  });

  it('Should be status 400  If the inputModel[name_field] has incorrect more than constrains value', async () => {
    const fields = {
      title: generateRandomStringForTest(postTitleConstraints.maxLength + 1),
      content: generateRandomStringForTest(
        postContentConstraints.maxLength + 1,
      ),
      shortDescription: generateRandomStringForTest(
        postShortDescConstraints.maxLength + 1,
      ),
    };
    for (const field in fields) {
      const value: string = fields[field];
      const postTitleResponse =
        await blogApiManger.createPostForBlog<ApiErrorResultType>(
          mainBlog.id,
          {
            ...postFakeData,
            [field]: value,
          },
          basicAuth,
        );

      expect(postTitleResponse.status).toBe(HttpStatus.BAD_REQUEST);

      expect(postTitleResponse.body).toMatchObject<ApiErrorResultType>({
        errorsMessages: expect.arrayContaining([
          { field: field, message: expect.any(String) },
        ]),
      });
    }
  });
});
