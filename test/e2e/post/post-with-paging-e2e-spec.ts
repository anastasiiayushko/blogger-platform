import { getAuthHeaderBasicTest } from '../../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../../helpers/api-manager/blog-api-manager';
import { initSettings } from '../../helpers/init-setting';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { PostViewDTO } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { PostApiManager } from '../../helpers/api-manager/post-api-manager';
import { PostQuerySortByEnum } from '../../../src/modules/bloggers-platform/posts/api/input-dto/get-post-query-params.input-dto';
import { SortDirection } from '../../../src/core/dto/base.query-params.input-dto';
import { AuthApiManager } from '../../helpers/api-manager/auth-api-manager';
import { CreateUsersInputDto } from '../../../src/modules/user-accounts/api/input-dto/create-users.input-dto';
import { LikeStatusEnum } from '../../../src/core/types/like-status.enum';
import { UsersApiManagerHelper } from '../../helpers/api-manager/users-api-manager-helper';

describe('Returns post with paging /posts/:postId', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let blogApiManger: BlogApiManager;
  let postApiManger: PostApiManager;
  let authApiManager: AuthApiManager;
  let userApiManager: UsersApiManagerHelper;

  let severalBlogs: BlogViewDto[];
  let postsForBlog1: PostViewDTO[]; // total posts 7
  let userCredential: CreateUsersInputDto = {
    login: 'login_user',
    password: 'loginuser123',
    email: 'loginuser@example.com',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    blogApiManger = new BlogApiManager(app);
    postApiManger = new PostApiManager(app);
    authApiManager = new AuthApiManager(app);
    userApiManager = new UsersApiManagerHelper(app);

    await userApiManager.createUser(userCredential, basicAuth);
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

  it('get list post with my status like', async () => {
    const totalCountPosts = postsForBlog1.length;
    const loginRes = await userApiManager.login({
      loginOrEmail: userCredential.login,
      password: userCredential.password,
    });
    expect(loginRes.status).toBe(HttpStatus.OK);

    const accessToken = loginRes.body.accessToken;
    const prePostMyStatus = [
      { postId: postsForBlog1[0].id, status: LikeStatusEnum.Like },
      { postId: postsForBlog1[1].id, status: LikeStatusEnum.Dislike },
      { postId: postsForBlog1[3].id, status: LikeStatusEnum.Like },
      { postId: postsForBlog1[4].id, status: LikeStatusEnum.None },
    ];
    for (let i = 0; i < prePostMyStatus.length; i++) {
      await postApiManger.setLikeStatus(
        prePostMyStatus[i].postId,
        prePostMyStatus[i].status,
        accessToken,
      );
    }

    const postsResponse = await postApiManger.getAll({}, accessToken);
    expect(postsResponse.status).toBe(HttpStatus.OK);

    const items: PostViewDTO[] = postsResponse.body.items;

    for (let i = 0; i < prePostMyStatus.length; i++) {
      const findPost = items.find((p) => p.id === prePostMyStatus[i].postId);
      if (!findPost) {
        continue;
      }
      expect(findPost.extendedLikesInfo.myStatus).toBe(
        prePostMyStatus[i].status,
      );
    }
  });
});
