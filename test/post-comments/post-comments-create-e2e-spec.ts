import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { initSettings } from '../helpers/init-setting';
import { PostViewDTO } from '../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { PostApiManager } from '../helpers/api-manager/post-api-manager';
import { commentContentConstraints } from '../../src/modules/bloggers-platform/comments/domain/comment.constraints';
import { AuthApiManager } from '../helpers/api-manager/auth-api-manager';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { JwtService } from '@nestjs/jwt';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { randomUUID } from 'crypto';
import { CommentViewDTO } from '../../src/modules/bloggers-platform/comments/api/view-dto/comment.view-dto';
import { CommentInputDto } from '../../src/modules/bloggers-platform/comments/api/input-dto/comment.input-dto';
import { LikeStatusEnum } from '../../src/modules/bloggers-platform/likes/domain/like-status.enum';
import { UserAccountConfig } from '../../src/modules/user-accounts/config/user-account.config';
import { UserSqlViewDto } from '../../src/modules/user-accounts/infrastructure/sql/mapper/users.sql-view-dto';
import { ApiErrorResultType } from '../type/response-super-test';

describe('Posts/Comments CREATED (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let postViewDTO: PostViewDTO;
  const userCredentials = {
    login: 'admin',
    email: 'admin@example.com',
    password: 'password123',
  };
  let userViewDto: UserSqlViewDto;
  let accessToken: string;
  const commentInputDto: CommentInputDto = {
    content: generateRandomStringForTest(
      commentContentConstraints.minLength + 1,
    ),
  };

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let authApiManager: AuthApiManager;
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
    authApiManager = new AuthApiManager(app);
    blogApiManger = new BlogApiManager(app);
    postApiManager = new PostApiManager(app);

    const userRes = await userApiManager.createUser(userCredentials, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
    userViewDto = userRes.body;

    const loginRes = await userApiManager.login({
      loginOrEmail: userCredentials.email,
      password: userCredentials.password,
    });
    expect(loginRes.status).toBe(HttpStatus.OK);
    accessToken = loginRes.body.accessToken;

    const createdBlogRes = await blogApiManger.create({
      name: 'string',
      description: 'string',
      websiteUrl: 'https://test-domain.com',
    });
    expect(createdBlogRes.status).toBe(HttpStatus.CREATED);
    const createdPostRes = await blogApiManger.createPostForBlog(
      createdBlogRes.body.id,
      { title: 'post-1', content: 'content', shortDescription: 'short des' },
    );
    expect(createdBlogRes.status).toBe(HttpStatus.CREATED);
    postViewDTO = createdPostRes.body as PostViewDTO;
  });
  afterAll(async () => {
    await app.close();
  });
  it('should be status 401 bearer token invalid', async () => {
    const invalidToken = accessTokenContext.sign(
      { userId: userViewDto.id },
      { expiresIn: '-20s' },
    );

    const createdCommentRes = await postApiManager.createComment(
      postViewDTO.id,
      commentInputDto,
      invalidToken,
    );

    expect(createdCommentRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('should be status 201 and the newly created comment', async () => {
    const createdCommentRes = await postApiManager.createComment(
      postViewDTO.id,
      commentInputDto,
      accessToken,
    );

    expect(createdCommentRes.status).toBe(HttpStatus.CREATED);

    expect(createdCommentRes.body).toEqual<CommentViewDTO>({
      id: expect.any(String),
      content: commentInputDto.content,
      commentatorInfo: {
        userId: userViewDto.id,
        userLogin: userViewDto.login,
      },
      likesInfo: {
        likesCount: 0,
        dislikesCount: 0,
        myStatus: LikeStatusEnum.None,
      },
      createdAt: expect.any(String),
    });
  });

  it("should be status 401 if postId doesn't exists", async () => {
    const createdCommentRes = await postApiManager.createComment(
      randomUUID(),
      commentInputDto,
      accessToken,
    );
    expect(createdCommentRes.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('should be status 400 If the inputModel has incorrect values', async () => {
    const commentMinRes = await postApiManager.createComment(
      postViewDTO.id,
      {
        content: generateRandomStringForTest(
          commentContentConstraints.minLength - 2,
        ),
      },
      accessToken,
    );
    expect(commentMinRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(commentMinRes.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'content', message: expect.any(String) }],
    });

    const commentMaxRes = await postApiManager.createComment(
      postViewDTO.id,
      {
        content: generateRandomStringForTest(
          commentContentConstraints.maxLength + 2,
        ),
      },
      accessToken,
    );
    expect(commentMaxRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(commentMaxRes.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'content', message: expect.any(String) }],
    });
  });
});
