import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { initSettings } from '../helpers/init-setting';
import { BlogViewDto } from '../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { PostViewDTO } from '../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { LikeStatusEnum } from '../../src/modules/bloggers-platform/likes/domain/like-status.enum';
import { randomUUID } from 'crypto';
import { PostApiManager } from '../helpers/api-manager/post-api-manager';
import { PostQuerySortByEnum } from '../../src/modules/bloggers-platform/posts/api/input-dto/get-post-query-params.input-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';

describe('Returns post with paging /posts/:postId', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let blogApiManger: BlogApiManager;
  let postApiManger: PostApiManager;

  let severalBlogs: BlogViewDto[];
  let postsForBlog1: PostViewDTO[];

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    blogApiManger = new BlogApiManager(app);
    postApiManger = new PostApiManager(app);

    severalBlogs = await blogApiManger.createSeveralBlogs(3, basicAuth);
    postsForBlog1 = await blogApiManger.createServerlPostsForBlog(
      severalBlogs[0].id,
      7,
    );

    expect(postsForBlog1.length).toBe(7);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be status 200 and query params by default', async () => {
    const totalCountPosts = postsForBlog1.length;

    const postsResponse = await postApiManger.getAll({
      sortBy: PostQuerySortByEnum.title,
      sortDirection: SortDirection.Asc,
    });

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
});
