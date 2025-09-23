import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { PostApiManager } from '../helpers/api-manager/post-api-manager';
import { initSettings } from '../helpers/init-setting';
import { CommentApiManager } from '../helpers/api-manager/comment-api-manager';
import { randomUUID } from 'crypto';
import { CommentViewDTO } from '../../src/modules/bloggers-platform/comments/infrastructure/mapper/comment.view-dto';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { SortByComment } from '../../src/modules/bloggers-platform/comments/api/input-dto/get-comments-query-params.input-dto';

describe('POSTS/Comments GET (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let targetPostId: string;
  const totalCountComments: number = 12;

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let blogApiManger: BlogApiManager;
  let postApiManager: PostApiManager;

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userApiManager = new UsersApiManagerHelper(app);
    blogApiManger = new BlogApiManager(app);
    postApiManager = new PostApiManager(app);

    const severalLoginUsers = await userApiManager.createAndLoginSeveralUsers(
      1,
      basicAuth,
    );
    expect(severalLoginUsers.length).toBe(1);

    const createdBlogRes = await blogApiManger.create({
      name: 'string',
      description: 'string',
      websiteUrl: 'https://test-domain.com',
    });

    expect(createdBlogRes.status).toBe(HttpStatus.CREATED);

    const postSeveralByBlog = await blogApiManger.createServerlPostsForBlog(
      createdBlogRes.body.id,
      1,
    );
    expect(postSeveralByBlog.length).toBe(1);
    targetPostId = postSeveralByBlog[0].id;

    const commentViewDTOS = await postApiManager.createSeveralCommentsForPost(
      postSeveralByBlog[0].id,
      totalCountComments,
      severalLoginUsers[0].accessToken,
    );

    expect(commentViewDTOS.length).toBe(totalCountComments);

  });

  afterAll(async () => {
    await app.close();
  });

  it('should be status 200 and return all comments by spec postId by def query', async () => {
    const commentRes =
      await postApiManager.getAllCommentsByPostAndQuery(targetPostId);

    expect(commentRes.status).toBe(HttpStatus.OK);

    expect(commentRes.body.page).toBe(1);
    expect(commentRes.body.totalCount).toBe(totalCountComments);
    expect(commentRes.body.pagesCount).toBe(Math.ceil(totalCountComments / 10));
    expect(commentRes.body.pageSize).toBe(10);

    expect(commentRes.body.items.length).toBe(10);
    expect(commentRes.body.items[0]).toEqual<CommentViewDTO>({
      id: expect.any(String),
      content: expect.any(String),
      commentatorInfo: {
        userId: expect.any(String),
        userLogin: expect.any(String),
      },
      likesInfo: {
        likesCount: expect.any(Number),
        dislikesCount: expect.any(Number),
        myStatus: expect.any(String),
      },
      createdAt: expect.any(String),
    });

    const commentPage2Res = await postApiManager.getAllCommentsByPostAndQuery(
      targetPostId,
      { pageSize: 2 },
    );

    expect(commentPage2Res.body.items.length).toBe(2);
  });

  it('should be status 404 if comment not exist ', async () => {
    const commentRes =
      await postApiManager.getAllCommentsByPostAndQuery(randomUUID());
    expect(commentRes.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should be status 200 sortBy content with less pageSize=3', async () => {
    const pageSize = 3;
    const pageCount = Math.ceil(totalCountComments / pageSize);

    const commentRes = await postApiManager.getAllCommentsByPostAndQuery(
      targetPostId,
      {
        sortBy: SortByComment.content,
        sortDirection: SortDirection.Asc,
        pageSize: pageSize,
      },
    );

    expect(commentRes.status).toBe(HttpStatus.OK);
    expect(commentRes.body.page).toBe(1);
    expect(commentRes.body.totalCount).toBe(totalCountComments);
    expect(commentRes.body.pagesCount).toBe(pageCount);
    expect(commentRes.body.pageSize).toBe(pageSize);
    expect(commentRes.body.items.length).toBe(pageSize);

    const commentLastPageRes =
      await postApiManager.getAllCommentsByPostAndQuery(targetPostId, {
        pageSize: pageSize,
        pageNumber: pageCount,
      });

    expect(commentLastPageRes.body.items.length).toBe(3);
  });
});
