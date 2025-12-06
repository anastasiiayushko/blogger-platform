import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../../api-manager/users-api-manager-helper';
import { BlogApiManager } from '../../api-manager/blog-api-manager';
import { PostApiManager } from '../../api-manager/post-api-manager';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { CommentApiManager } from '../../api-manager/comment-api-manager';
import { randomUUID } from 'crypto';
import { LikeStatusEnum } from '../../../src/core/types/like-status.enum';
import { CommentViewDTO } from '../../../src/modules/bloggers-platform/comments/api/view-dto/comment.view-dto';

describe('Comments GET (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let severalCommentsView: CommentViewDTO[];

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let commentApiManager: CommentApiManager;
  let blogApiManger: BlogApiManager;
  let postApiManager: PostApiManager;

  beforeAll(async () => {
    const init = await setupNextAppHttp();
    app = init.app;
    userApiManager = new UsersApiManagerHelper(app);
    blogApiManger = new BlogApiManager(app);
    postApiManager = new PostApiManager(app);
    commentApiManager = new CommentApiManager(app);

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

    severalCommentsView = await postApiManager.createSeveralCommentsForPost(
      postSeveralByBlog[0].id,
      3,
      severalLoginUsers[0].accessToken,
    );
  });
  afterAll(async () => {
    await app.close();
  });
  it('should be status 200 and return comment by param commentId', async () => {
    const targetComment = severalCommentsView[0];
    const commentRes = await commentApiManager.findById(targetComment.id);

    expect(commentRes.status).toBe(HttpStatus.OK);
    expect(commentRes.body).toEqual<CommentViewDTO>({
      id: targetComment.id,
      content: targetComment.content,
      commentatorInfo: {
        userId: expect.any(String),
        userLogin: expect.any(String),
      },
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatusEnum.None,
      },
      createdAt: targetComment.createdAt,
    });
  });

  it('should be status 404 if comment not exist ', async () => {
    const commentRes = await commentApiManager.findById(randomUUID());
    expect(commentRes.status).toBe(HttpStatus.NOT_FOUND);
  });
});
