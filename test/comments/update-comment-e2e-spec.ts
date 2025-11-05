import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../helpers/common-helpers';
import { commentContentConstraints } from '../../src/modules/bloggers-platform/comments/domain/comment.constraints';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { PostApiManager } from '../helpers/api-manager/post-api-manager';
import { JwtService } from '@nestjs/jwt';
import { initSettings } from '../helpers/init-setting';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { UserAccountConfig } from '../../src/modules/user-accounts/config/user-account.config';
import { CommentApiManager } from '../helpers/api-manager/comment-api-manager';
import { randomUUID } from 'crypto';
import { CommentViewDTO } from '../../src/modules/bloggers-platform/comments/infrastructure/mapper/comment.view-dto';
import { ApiErrorResultType } from '../type/response-super-test';
import { LikeStatusEnum } from '../../src/core/types/like-status.enum';

describe('Comments UPDATE (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
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
    const init = await initSettings((moduleBuilder) =>
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
    const targetComment = createdComment[0];

    const decode = accessTokenContext.decode(firstUserAToken);
    const updateRes = await commentApiManager.updateComment(
      targetComment.id,
      { content: 'test' },
      accessTokenContext.sign({ userId: decode.userId }, { expiresIn: '-10m' }),
    );

    expect(updateRes.status).toBe(HttpStatus.UNAUTHORIZED);

    const commentRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );

    expect(commentRes.status).toBe(HttpStatus.OK);
    expect(commentRes.body).toEqual<CommentViewDTO>({
      id: targetComment.id,
      content: targetComment.content,
      commentatorInfo: {
        userId: decode.userId,
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

  it('should be status 204 and successful updated comment', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );
    const targetComment = createdComment[0];
    const decode = accessTokenContext.decode(firstUserAToken);
    const payload = {
      content: generateRandomStringForTest(
        commentContentConstraints.minLength + 1,
      ),
    };
    const updateRes = await commentApiManager.updateComment(
      targetComment.id,
      payload,
      firstUserAToken,
    );

    expect(updateRes.status).toBe(HttpStatus.NO_CONTENT);

    const commentRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );

    expect(commentRes.status).toBe(HttpStatus.OK);
    expect(commentRes.body).toEqual<CommentViewDTO>({
      id: targetComment.id,
      content: payload.content,
      commentatorInfo: {
        userId: decode.userId,
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

  it('should be status 403 If try edit the comment that is not your own', async () => {
    const commentFirstUser = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );

    const payload = {
      content: generateRandomStringForTest(
        commentContentConstraints.minLength + 1,
      ),
    };

    const trustUpdateGuestRes = await commentApiManager.updateComment(
      commentFirstUser[0].id,
      payload,
      secondUserAToken,
    );

    expect(trustUpdateGuestRes.status).toBe(HttpStatus.FORBIDDEN);

    const commentRes = await commentApiManager.findById(
      commentFirstUser[0].id,
      secondUserAToken,
    );
    console.log('findComment', commentRes);

    expect(commentRes.status).toBe(HttpStatus.OK);
    expect(commentRes.body.content).toBe(commentFirstUser[0].content);
  });

  it('should be status 400 If the inputModel has incorrect values', async () => {
    const createdComments = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      secondUserAToken,
    );
    const editCommentId = createdComments[0].id;
    const contentPayload = [
      generateRandomStringForTest(commentContentConstraints.minLength - 1),
      generateRandomStringForTest(commentContentConstraints.maxLength + 1),
    ];
    for (let i = 0; i < contentPayload.length; i++) {
      const errorRes = await commentApiManager.updateComment(
        editCommentId,
        {
          content: contentPayload[i],
        },
        secondUserAToken,
      );
      expect(errorRes.status).toBe(HttpStatus.BAD_REQUEST);
      expect(errorRes.body).toEqual<ApiErrorResultType>({
        errorsMessages: [{ field: 'content', message: expect.any(String) }],
      });
    }
  });

  it('should be status 404 if comment not exist ', async () => {
    const updateRes = await commentApiManager.updateComment(
      randomUUID(),
      {
        content: generateRandomStringForTest(
          commentContentConstraints.minLength + 1,
        ),
      },
      firstUserAToken,
    );

    expect(updateRes.status).toBe(HttpStatus.NOT_FOUND);
  });
});
