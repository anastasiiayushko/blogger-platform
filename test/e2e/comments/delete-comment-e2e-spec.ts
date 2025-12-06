import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../../api-manager/users-api-manager-helper';
import { BlogApiManager } from '../../api-manager/blog-api-manager';
import { PostApiManager } from '../../api-manager/post-api-manager';
import { JwtService } from '@nestjs/jwt';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { UserAccountConfig } from '../../../src/modules/user-accounts/config/user-account.config';
import { CommentApiManager } from '../../api-manager/comment-api-manager';
import { randomUUID } from 'crypto';

describe('Comments DELETE (e2e) ', () => {
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
    const targetComment = createdComment[0];

    const decode = accessTokenContext.decode(firstUserAToken);
    const deleteCommentRes = await commentApiManager.deleteCommentById(
      targetComment.id,
      accessTokenContext.sign({ userId: decode.userId }, { expiresIn: '-10m' }),
    );

    expect(deleteCommentRes.status).toBe(HttpStatus.UNAUTHORIZED);

    const commentRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );
    expect(commentRes.status).toBe(HttpStatus.OK);
  });

  it('should be status 204', async () => {
    const createdComment = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );
    const targetComment = createdComment[0];

    const deleteCommentRes = await commentApiManager.deleteCommentById(
      targetComment.id,
      firstUserAToken,
    );

    expect(deleteCommentRes.status).toBe(HttpStatus.NO_CONTENT);

    const commentRes = await commentApiManager.findById(
      targetComment.id,
      firstUserAToken,
    );

    expect(commentRes.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should be status 403 If try edit the comment that is not your own', async () => {
    const commentFirstUser = await postApiManager.createSeveralCommentsForPost(
      targetPostId,
      1,
      firstUserAToken,
    );

    const trustUpdateGuestRes = await commentApiManager.deleteCommentById(
      commentFirstUser[0].id,
      secondUserAToken,
    );

    expect(trustUpdateGuestRes.status).toBe(HttpStatus.FORBIDDEN);

    const commentRes = await commentApiManager.findById(
      commentFirstUser[0].id,
      secondUserAToken,
    );
    expect(commentRes.status).toBe(HttpStatus.OK);
  });

  it('should be status 404 if comment not exist ', async () => {
    const updateRes = await commentApiManager.deleteCommentById(
      randomUUID(),
      firstUserAToken,
    );

    expect(updateRes.status).toBe(HttpStatus.NOT_FOUND);
  });
});
