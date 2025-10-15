import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { initSettings } from '../helpers/init-setting';
import { BlogViewDto } from '../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { PostViewDTO } from '../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { randomUUID } from 'crypto';
import { PostApiManager } from '../helpers/api-manager/post-api-manager';
import { LikeStatusEnum } from '../../src/core/types/like-status.enum';

describe('Returns post by id /posts/:postId', () => {
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
    const targetPost = postsForBlog1[0];

    const postRes = await postApiManger.findById(targetPost.id);

    expect(postRes.status).toBe(HttpStatus.OK);

    // // Проверка массива items отдельно
    expect(postRes.body).toMatchObject({
      id: targetPost.id,
      title: targetPost.title,
      shortDescription: targetPost.shortDescription,
      content: targetPost.content,
      createdAt: targetPost.createdAt,
      blogId: targetPost.blogId,
      blogName: targetPost.blogName,
      extendedLikesInfo: expect.objectContaining({
        likesCount: expect.any(Number),
        dislikesCount: expect.any(Number),
        myStatus: expect.stringMatching(
          new RegExp(`^(${Object.values(LikeStatusEnum).join('|')})$`),
        ),
        newestLikes: expect.any(Array),
      }),
    });
  });

  it('Should be status 404 if postId not existing', async () => {
    const postRes = await postApiManger.findById(randomUUID());

    expect(postRes.status).toBe(HttpStatus.NOT_FOUND);
  });
});
