import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { initSettings } from '../helpers/init-setting';
import { BlogViewDto } from '../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { PostViewDTO } from '../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { LikeStatusEnum } from '../../src/modules/bloggers-platform/likes/domain/like-status.enum';
import { randomUUID } from 'crypto';

describe('Returns posts for blog with paging  and sorting /blogs/:blogId/posts', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let blogApiManger: BlogApiManager;

  let severalBlogs: BlogViewDto[];
  let postsForBlog1: PostViewDTO[];
  let postsForBlog2: PostViewDTO[];

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    blogApiManger = new BlogApiManager(app);

    severalBlogs = await blogApiManger.createSeveralBlogs(3, basicAuth);
    postsForBlog1 = await blogApiManger.createServerlPostsForBlog(
      severalBlogs[0].id,
      7,
    );
    postsForBlog2 = await blogApiManger.createServerlPostsForBlog(
      severalBlogs[2].id,
      12,
    );
    expect(postsForBlog1.length).toBe(7);
    expect(postsForBlog2.length).toBe(12);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be status 200 and query params by default', async () => {
    const blog1Id = severalBlogs[0].id;
    const totalCountPosts = postsForBlog1.length;

    expect(totalCountPosts).toEqual(7);

    const postsResponse =
      await blogApiManger.getPostsWithPagingByParamBlogId(blog1Id);

    expect(postsResponse.status).toBe(HttpStatus.OK);

    expect(postsResponse.body.totalCount).toEqual(totalCountPosts);
    expect(postsResponse.body.pagesCount).toEqual(1);
    expect(postsResponse.body.page).toEqual(1);
    expect(postsResponse.body.pageSize).toEqual(10);
    expect(postsResponse.body.items.length).toEqual(totalCountPosts);

    // // Проверка массива items отдельно
    expect(postsResponse.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          shortDescription: expect.any(String),
          content: expect.any(String),
          createdAt: expect.any(String),
          blogId: expect.any(String),
          blogName: expect.any(String),
          extendedLikesInfo: expect.objectContaining({
            likesCount: expect.any(Number),
            dislikesCount: expect.any(Number),
            myStatus: expect.stringMatching(
              new RegExp(`^(${Object.values(LikeStatusEnum).join('|')})$`),
            ),
            newestLikes: expect.any(Array),
          }),
        }),
      ]),
    );
  });

  it('Should be status 200 and set pageSize', async () => {
    const blog2Id = severalBlogs[2].id;
    const totalCountPosts = postsForBlog2.length;
    const pageSize = 3;
    const pagesCount = Math.ceil(totalCountPosts / pageSize);


    const postsResponse = await blogApiManger.getPostsWithPagingByParamBlogId(
      blog2Id,
      { pageSize: pageSize },
    );

    expect(postsResponse.status).toBe(HttpStatus.OK);

    expect(postsResponse.body.totalCount).toEqual(totalCountPosts);
    expect(postsResponse.body.pagesCount).toEqual(pagesCount);
    expect(postsResponse.body.page).toEqual(1);
    expect(postsResponse.body.pageSize).toEqual(pageSize);
    expect(postsResponse.body.items.length).toEqual(pageSize);
  });

  it('Should be status 404 if blogId not exising', async () => {
    const blog1Id = randomUUID();

    const postsResponse =
      await blogApiManger.getPostsWithPagingByParamBlogId(blog1Id);

    expect(postsResponse.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should be status 401 if user unauthorized', async () => {
    const blog1Id = severalBlogs[0].id;

    const postsResponse = await blogApiManger.getPostsWithPagingByParamBlogId(
      blog1Id,
      {},
      getAuthHeaderBasicTest('admin:no-pass'),
    );

    expect(postsResponse.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
