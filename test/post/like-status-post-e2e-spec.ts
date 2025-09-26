import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { PostApiManager } from '../helpers/api-manager/post-api-manager';
import { JwtService } from '@nestjs/jwt';
import { initSettings } from '../helpers/init-setting';
import { ACCESS_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { UserAccountConfig } from '../../src/modules/user-accounts/config/user-account.config';
import { LikeStatusEnum } from '../../src/core/types/like-status.enum';
import { ApiErrorResultType } from '../type/response-super-test';
import { randomUUID } from 'crypto';
import { PostInputDTO } from '../../src/modules/bloggers-platform/posts/api/input-dto/post.input-dto';
import { PostViewDTO } from '../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';

describe('POSTS/LIKE-STATUS UPDATE (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let firstUserAToken: string;
  let secondUserAToken: string;
  let targetBlogId: string;

  const getPostInputDto = (blogId: string): PostInputDTO => {
    return {
      title: generateRandomStringForTest(10),
      shortDescription: generateRandomStringForTest(10),
      content: generateRandomStringForTest(20),
      blogId: blogId,
    };
  };

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
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
    targetBlogId = createdBlogRes.body.id;
  });
  afterAll(async () => {
    await app.close();
  });
  it('should be status 401 bearer token invalid', async () => {
    const createdPost = await postApiManager.create(
      getPostInputDto(targetBlogId),
    );
    expect(createdPost.status).toBe(HttpStatus.CREATED);

    const reactionErrorRes = await postApiManager.setLikeStatus(
      createdPost.body.id,
      LikeStatusEnum.Like,
      accessTokenContext.sign({ userId: randomUUID() }, { expiresIn: '-10m' }),
    );

    expect(reactionErrorRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('returns 204 and updates likes count when another user likes a comment', async () => {
    const createdPostRes = await postApiManager.create(
      getPostInputDto(targetBlogId),
    );
    expect(createdPostRes.status).toBe(HttpStatus.CREATED);

    const targetPost = createdPostRes.body;
    const decodeSecondUserAT = accessTokenContext.decode(secondUserAToken);

    expect(targetPost.extendedLikesInfo.likesCount).toBe(0);
    expect(targetPost.extendedLikesInfo.dislikesCount).toBe(0);
    expect(targetPost.extendedLikesInfo.newestLikes.length).toBe(0);

    const reactionRes = await postApiManager.setLikeStatus(
      targetPost.id,
      LikeStatusEnum.Like,
      secondUserAToken,
    );

    expect(reactionRes.status).toBe(HttpStatus.NO_CONTENT);

    const postRes = await postApiManager.findById(
      targetPost.id,
      secondUserAToken,
    );

    expect(postRes.status).toBe(HttpStatus.OK);

    expect(postRes.body).toEqual<PostViewDTO>({
      id: targetPost.id,
      title: targetPost.title,
      content: targetPost.content,
      shortDescription: targetPost.shortDescription,
      blogId: targetPost.blogId,
      blogName: targetPost.blogName,
      extendedLikesInfo: {
        likesCount: 1,
        dislikesCount: 0,
        myStatus: LikeStatusEnum.Like,
        newestLikes: [
          {
            userId: decodeSecondUserAT.userId,
            login: expect.any(String),
            addedAt: expect.any(String),
          },
        ],
      },
      createdAt: targetPost.createdAt,
    });
  });

  it('returns 204 and updates dislikes count when another user likes a comment', async () => {
    const createdPostRes = await postApiManager.create(
      getPostInputDto(targetBlogId),
    );
    expect(createdPostRes.status).toBe(HttpStatus.CREATED);

    const targetPost = createdPostRes.body;
    const decodeSecondUserAT = accessTokenContext.decode(secondUserAToken);

    expect(targetPost.extendedLikesInfo.likesCount).toBe(0);
    expect(targetPost.extendedLikesInfo.dislikesCount).toBe(0);
    expect(targetPost.extendedLikesInfo.newestLikes.length).toBe(0);

    const reactionRes = await postApiManager.setLikeStatus(
      targetPost.id,
      LikeStatusEnum.Dislike,
      secondUserAToken,
    );

    expect(reactionRes.status).toBe(HttpStatus.NO_CONTENT);

    const postRes = await postApiManager.findById(
      targetPost.id,
      secondUserAToken,
    );

    expect(postRes.status).toBe(HttpStatus.OK);

    expect(postRes.body.extendedLikesInfo.likesCount).toBe(0);
    expect(postRes.body.extendedLikesInfo.dislikesCount).toBe(1);
    expect(postRes.body.extendedLikesInfo.myStatus).toBe(LikeStatusEnum.Dislike);
    expect(postRes.body.extendedLikesInfo.newestLikes.length).toBe(0);
  });
  it('should toggle like status on a post', async () => {
    const createdPostRes = await postApiManager.create(
      getPostInputDto(targetBlogId),
    );
    expect(createdPostRes.status).toBe(HttpStatus.CREATED);

    const targetPost = createdPostRes.body;

    expect(targetPost.extendedLikesInfo.likesCount).toBe(0);
    expect(targetPost.extendedLikesInfo.dislikesCount).toBe(0);
    expect(targetPost.extendedLikesInfo.newestLikes.length).toBe(0);

    await postApiManager.setLikeStatus(
      targetPost.id,
      LikeStatusEnum.Like,
      firstUserAToken,
    );

    const postLikeRes = await postApiManager.findById(
      targetPost.id,
      firstUserAToken,
    );

    expect(postLikeRes.body.extendedLikesInfo.myStatus).toEqual(
      LikeStatusEnum.Like,
    );
    expect(postLikeRes.body.extendedLikesInfo.likesCount).toBe(1);
    expect(postLikeRes.body.extendedLikesInfo.dislikesCount).toBe(0);
    expect(postLikeRes.body.extendedLikesInfo.newestLikes.length).toBe(1);

    await postApiManager.setLikeStatus(
      targetPost.id,
      LikeStatusEnum.None,
      firstUserAToken,
    );

    const postNoneRes = await postApiManager.findById(
      targetPost.id,
      firstUserAToken,
    );

    expect(postNoneRes.body.extendedLikesInfo.myStatus).toBe(
      LikeStatusEnum.None,
    );
    expect(postNoneRes.body.extendedLikesInfo.likesCount).toBe(0);
    expect(postNoneRes.body.extendedLikesInfo.dislikesCount).toBe(0);
    expect(postNoneRes.body.extendedLikesInfo.newestLikes.length).toBe(0);

    const postNoneRepeatRes = await postApiManager.findById(
      targetPost.id,
      firstUserAToken,
    );

    expect(postNoneRepeatRes.body.extendedLikesInfo.myStatus).toBe(
      LikeStatusEnum.None,
    );
    expect(postNoneRepeatRes.body.extendedLikesInfo.likesCount).toBe(0);
    expect(postNoneRepeatRes.body.extendedLikesInfo.dislikesCount).toBe(0);
    expect(postNoneRepeatRes.body.extendedLikesInfo.newestLikes.length).toBe(0);
  });

  it('should set first like None not set on a comment', async () => {
    const createdPostRes = await postApiManager.create(
      getPostInputDto(targetBlogId),
    );
    expect(createdPostRes.status).toBe(HttpStatus.CREATED);

    const targetPost = createdPostRes.body;

    expect(targetPost.extendedLikesInfo.likesCount).toBe(0);
    expect(targetPost.extendedLikesInfo.dislikesCount).toBe(0);

    await postApiManager.setLikeStatus(
      targetPost.id,
      LikeStatusEnum.None,
      firstUserAToken,
    );

    const postRes = await postApiManager.findById(
      targetPost.id,
      firstUserAToken,
    );

    expect(postRes.body.extendedLikesInfo.likesCount).toBe(0);
    expect(postRes.body.extendedLikesInfo.dislikesCount).toBe(0);
  });

  it('should be status 400 If the inputModel has incorrect values', async () => {
    const createdPostRes = await postApiManager.create(
      getPostInputDto(targetBlogId),
    );
    expect(createdPostRes.status).toBe(HttpStatus.CREATED);

    const targetPost = createdPostRes.body;

    const reactionErrorRes = await postApiManager.setLikeStatus(
      targetPost.id,
      ' likes   ' as unknown as LikeStatusEnum,
      firstUserAToken,
    );

    expect(reactionErrorRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(reactionErrorRes.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'likeStatus', message: expect.any(String) }],
    });
  });

  it('should be status 404 if comment not exist ', async () => {
    const reactionErrorRes = await postApiManager.setLikeStatus(
      randomUUID(),
      LikeStatusEnum.Like,
      firstUserAToken,
    );

    expect(reactionErrorRes.status).toBe(HttpStatus.NOT_FOUND);
  });


});
