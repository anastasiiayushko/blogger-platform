import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../../helpers/api-manager/blog-api-manager';
import { initSettings } from '../../helpers/init-setting';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { BlogPostInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog-post.input-dto';
import {
  postShortDescConstraints,
  postTitleConstraints,
} from '../../../src/modules/bloggers-platform/posts/domain/post.constraints';
import { PostViewDTO } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { randomUUID } from 'crypto';
import { BlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import { ApiErrorResultType } from '../type/response-super-test';
import { PostQueryRepository } from '../../../src/modules/bloggers-platform/posts/infrastructure/query-repository/post.query-repository';

describe('Sa update post for specific blog /blogs/:blogId/posts/:postId', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let blogApiManger: BlogApiManager;
  let postQueryRepository: PostQueryRepository;
  let mainBlog: BlogViewDto;
  let mainPost: PostViewDTO;
  const blogFakeData: BlogInputDto = {
    name: 'fake blog',
    description: 'this blog about fake data',
    websiteUrl: 'https://test-website-url.com',
  };
  const postFakeData: BlogPostInputDto = {
    title: 'fake title',
    shortDescription: 'this post about fake data',
    content: 'This post about fake big data',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    blogApiManger = new BlogApiManager(app);
    postQueryRepository = app.get<PostQueryRepository>(PostQueryRepository);

    const createdBlogRes = await blogApiManger.create(blogFakeData, basicAuth);
    expect(createdBlogRes.status).toBe(HttpStatus.CREATED);
    mainBlog = createdBlogRes.body;

    const createdPostRes = await blogApiManger.createPostForBlog(
      mainBlog.id,
      postFakeData,
    );
    expect(createdPostRes.status).toBe(HttpStatus.CREATED);
    mainPost = createdPostRes.body;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be status 204 and success update post', async () => {
    const fields = {
      title: 'update title',
      content: 'update content',
      shortDescription: 'update shortDescription',
    };

    for (let field in fields) {
      const bodyForUpdate = {
        ...postFakeData,
        [field]: fields[field],
      };
      const updatePostResponse = await blogApiManger.updatePostForBlog(
        { blogId: mainBlog.id, postId: mainPost.id },
        bodyForUpdate,
      );
      expect(updatePostResponse.status).toBe(HttpStatus.NO_CONTENT);

      const targetPost = await postQueryRepository.getByIdOrNotFoundFail(
        mainPost.id,
      );

      expect(targetPost.title).toBe(bodyForUpdate.title);
      expect(targetPost.content).toBe(bodyForUpdate.content);
      expect(targetPost.shortDescription).toBe(bodyForUpdate.shortDescription);
    }
  });

  it('Should be status 400 If the inputModel[field_name] has incorrect values', async () => {
    const postBeforeUpdate = await postQueryRepository.getByIdOrNotFoundFail(
      mainPost.id,
    );
    const fields = {
      title: generateRandomStringForTest(postTitleConstraints.maxLength + 1),
      content: '   ',
      shortDescription: generateRandomStringForTest(
        postShortDescConstraints.maxLength + 1,
      ),
    };

    for (let field in fields) {
      const bodyForUpdate = {
        ...postFakeData,
        [field]: fields[field],
      };
      const updatePostResponse = await blogApiManger.updatePostForBlog(
        { blogId: mainBlog.id, postId: mainPost.id },
        bodyForUpdate,
      );
      expect(updatePostResponse.status).toBe(HttpStatus.BAD_REQUEST);

      expect(updatePostResponse.body).toEqual<ApiErrorResultType>({
        errorsMessages: [{ field: field, message: expect.any(String) }],
      });

      const targetPost = await postQueryRepository.getByIdOrNotFoundFail(
        mainPost.id,
      );

      expect(targetPost.title).toBe(postBeforeUpdate.title);
      expect(targetPost.content).toBe(postBeforeUpdate.content);
      expect(targetPost.shortDescription).toBe(
        postBeforeUpdate.shortDescription,
      );
    }
  });

  it('Should be status 401 Unauthorized', async () => {
    const updatePostResponse = await blogApiManger.updatePostForBlog(
      { blogId: mainBlog.id, postId: mainPost.id },
      postFakeData,
      getAuthHeaderBasicTest('admin:no-pass'),
    );

    expect(updatePostResponse.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should be status 404  If parameter blogId not existing', async () => {
    const response = await blogApiManger.updatePostForBlog(
      { blogId: randomUUID(), postId: mainPost.id },
      postFakeData,
    );

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should be status 404  If parameter postId not existing', async () => {
    const response = await blogApiManger.updatePostForBlog(
      { blogId: mainBlog.id, postId: randomUUID() },
      postFakeData,
    );

    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
});
