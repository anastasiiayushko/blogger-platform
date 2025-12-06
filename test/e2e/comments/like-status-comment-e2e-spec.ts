import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../../api-manager/users-api-manager-helper';
import { CommentApiManager } from '../../api-manager/comment-api-manager';
import { BlogApiManager } from '../../api-manager/blog-api-manager';
import { PostApiManager } from '../../api-manager/post-api-manager';
import { JwtService } from '@nestjs/jwt';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { UserAccountConfig } from '../../../src/modules/user-accounts/config/user-account.config';
import { CommentViewDTO } from '../../../src/modules/bloggers-platform/comments/api/view-dto/comment.view-dto';
import { LikeStatusEnum } from '../../../src/core/types/like-status.enum';
import { ApiErrorResultType } from '../type/response-super-test';
import { randomUUID } from 'crypto';

describe('Comments/LIKE-STATUS UPDATE (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let severalCommentsDto: CommentViewDTO;
  let targetPostId: string;
  let firstUserAToken: string;
  let secondUserAToken: string;

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let commentApiManager: CommentApiManager;
  let blogApiManger: BlogApiManager;
  let postApiManager: PostApiManager;
  let accessTokenContext: JwtService;

  beforeAll(async () => {
    const init = await setupNextAppHttp((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (cfg: UserAccountConfig) =>
            new JwtService({
              secret: cfg.assessTokenSecret,
              signOptions: { expiresIn: '10m' },
            }),
          inject: [UserAccountConfig],
        }),
    );
    app = init.app;
    accessTokenContext = app.get<JwtService>(
      ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
    );
    userApiManager = new UsersApiManagerHelper(app);
    blogApiManger = new BlogApiManager(app);
    postApiManager = new PostApiManager(app);
    commentApiManager = new CommentApiManager(app);

    const severalLoginUsers = await userApiManager.createAndLoginSeveralUsers(
      2,
      basicAuth,
    );
    expect(severalLoginUsers.length).toBe(2);
    firstUserAToken = severalLoginUsers[0].accessToken;
    secondUserAToken = severalLoginUsers[1].accessToken;

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
  });
  afterAll(async () => {
    await app.close();
  });
  it('should be status 401 bearer token invalid', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );
    const reactionErrorRes = await commentApiManager.setLikeStatus(
      createdComment[0].id,
      ' likes   ' as unknown as LikeStatusEnum,
      accessTokenContext.sign({ userId: randomUUID() }, { expiresIn: '-10m' }),
    );

    expect(reactionErrorRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('returns 204 and updates likes count when another user likes a comment', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );
    const targetComment = createdComment[0];

    expect(targetComment.likesInfo.likesCount).toBe(0);

    const reactionRes = await commentApiManager.setLikeStatus(
      targetComment.id,
      LikeStatusEnum.Like,
      secondUserAToken,
    );

    expect(reactionRes.status).toBe(HttpStatus.NO_CONTENT);

    const commentRes = await commentApiManager.findById(
      targetComment.id,
      secondUserAToken,
    );

    expect(commentRes.status).toBe(HttpStatus.OK);

    expect(commentRes.body).toEqual<CommentViewDTO>({
      id: targetComment.id,
      content: expect.any(String),
      commentatorInfo: {
        userId: expect.any(String),
        userLogin: expect.any(String),
      },
      likesInfo: {
        likesCount: 1,
        dislikesCount: 0,
        myStatus: LikeStatusEnum.Like,
      },
      createdAt: targetComment.createdAt,
    });
  });

  it('returns 204 and updates dislikes count when another user likes a comment', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );
    const targetComment = createdComment[0];

    expect(targetComment.likesInfo.dislikesCount).toBe(0);

    const reactionRes = await commentApiManager.setLikeStatus(
      targetComment.id,
      LikeStatusEnum.Dislike,
      secondUserAToken,
    );

    expect(reactionRes.status).toBe(HttpStatus.NO_CONTENT);

    const commentRes = await commentApiManager.findById(
      targetComment.id,
      secondUserAToken,
    );

    expect(commentRes.status).toBe(HttpStatus.OK);

    expect(commentRes.body).toEqual<CommentViewDTO>({
      id: targetComment.id,
      content: expect.any(String),
      commentatorInfo: {
        userId: expect.any(String),
        userLogin: expect.any(String),
      },
      likesInfo: {
        likesCount: 0,
        dislikesCount: 1,
        myStatus: LikeStatusEnum.Dislike,
      },
      createdAt: targetComment.createdAt,
    });
  });
  it('should toggle like status on a comment', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );

    const targetComment = createdComment[0];

    expect(targetComment.likesInfo.likesCount).toBe(0);
    expect(targetComment.likesInfo.dislikesCount).toBe(0);

    await commentApiManager.setLikeStatus(
      targetComment.id,
      LikeStatusEnum.Like,
      firstUserAToken,
    );

    const commentLikeRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );

    expect(commentLikeRes.body.likesInfo).toEqual({
      likesCount: 1,
      dislikesCount: 0,
      myStatus: LikeStatusEnum.Like,
    });

    await commentApiManager.setLikeStatus(
      targetComment.id,
      LikeStatusEnum.None,
      firstUserAToken,
    );

    const commentNoneRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );

    expect(commentNoneRes.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatusEnum.None,
    });

    const commentNoneRepeatRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );

    expect(commentNoneRepeatRes.body.likesInfo).toEqual({
      likesCount: 0,
      dislikesCount: 0,
      myStatus: LikeStatusEnum.None,
    });
  });

  it('should set first like None not set on a comment', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );

    const targetComment = createdComment[0];

    expect(targetComment.likesInfo.likesCount).toBe(0);
    expect(targetComment.likesInfo.dislikesCount).toBe(0);

    await commentApiManager.setLikeStatus(
      targetComment.id,
      LikeStatusEnum.None,
      firstUserAToken,
    );

    const commentRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );

    expect(commentRes.body.likesInfo.likesCount).toBe(0);
    expect(commentRes.body.likesInfo.dislikesCount).toBe(0);
  });

  it('should be status 400 If the inputModel has incorrect values', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );
    const targetComment = createdComment[0];

    const reactionErrorRes = await commentApiManager.setLikeStatus(
      targetComment.id,
      ' likes   ' as unknown as LikeStatusEnum,
      firstUserAToken,
    );

    expect(reactionErrorRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reactionErrorRes.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'likeStatus', message: expect.any(String) }],
    });
  });

  it('should be status 404 if comment not exist ', async () => {
    const reactionErrorRes = await commentApiManager.setLikeStatus(
      randomUUID(),
      LikeStatusEnum.Like,
      firstUserAToken,
    );

    expect(reactionErrorRes.status).toBe(HttpStatus.NOT_FOUND);
  });
});
