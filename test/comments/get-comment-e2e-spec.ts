import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { PostApiManager } from '../helpers/api-manager/post-api-manager';
import { initSettings } from '../helpers/init-setting';
import { CommentApiManager } from '../helpers/api-manager/comment-api-manager';
import { randomUUID } from 'crypto';
import { CommentViewDTO } from '../../src/modules/bloggers-platform/comments/infrastructure/mapper/comment.view-dto';
import { LikeStatusEnum } from '../../src/modules/bloggers-platform/likes/domain/like-status.enum';

describe('Comments GET (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let severalCommentsView: CommentViewDTO[];

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let commentApiManager: CommentApiManager;
  let blogApiManger: BlogApiManager;
  let postApiManager: PostApiManager;

  beforeAll(async () => {
    const init = await initSettings();
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
