import { getAuthHeaderBasicTest } from '../../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { BlogApiManager } from '../../helpers/api-manager/blog-api-manager';
import { initSettings } from '../../helpers/init-setting';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { BlogPostInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog-post.input-dto';
import { PostViewDTO } from '../../../src/modules/bloggers-platform/posts/api/view-dto/post.view-dto';
import { randomUUID } from 'crypto';
import { BlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import { PostQueryRepository } from '../../../src/modules/bloggers-platform/posts/infrastructure/query-repository/post.query-repository';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { PostApiManager } from '../../helpers/api-manager/post-api-manager';

describe('Sa delete post specified by id /blogs/:blogId/posts/:postId', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let blogApiManger: BlogApiManager;
  let postApiManger: PostApiManager;
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
    postApiManger = new PostApiManager(app);
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
  it('Should be status 401 Unauthorized', async () => {
    const deletePostResponse = await blogApiManger.deletePostIdForBlog(
      {
        blogId: mainBlog.id,
        postId: mainPost.id,
      },
      getAuthHeaderBasicTest('admin:no-pass'),
    );
    expect(deletePostResponse.status).toBe(HttpStatus.UNAUTHORIZED);

    const post = await postQueryRepository.getByIdOrNotFoundFail(mainPost.id);

    expect(post).not.toBeNull();
  });

  it('Should be status 404  If parameter blogId not existing', async () => {
    const deletePostResponse = await blogApiManger.deletePostIdForBlog({
      blogId: randomUUID(),
      postId: mainPost.id,
    });

    expect(deletePostResponse.status).toBe(HttpStatus.NOT_FOUND);
    const post = await postQueryRepository.getByIdOrNotFoundFail(mainPost.id);

    expect(post).not.toBeNull();
  });

  it('Should be status 404  If parameter postId not existing', async () => {
    const deletePostResponse = await blogApiManger.deletePostIdForBlog({
      blogId: mainBlog.id,
      postId: randomUUID(),
    });

    expect(deletePostResponse.status).toBe(HttpStatus.NOT_FOUND);
    const post = await postQueryRepository.getByIdOrNotFoundFail(mainPost.id);

    expect(post).not.toBeNull();
  });

  it('Should be status 204 and success update post', async () => {
    const deletePostResponse = await blogApiManger.deletePostIdForBlog({
      blogId: mainBlog.id,
      postId: mainPost.id,
    });
    expect(deletePostResponse.status).toBe(HttpStatus.NO_CONTENT);

    await expect(
      postQueryRepository.getByIdOrNotFoundFail(mainPost.id),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it('Should be status 404 check soft-delete post', async () => {
    const createdPostRes = await blogApiManger.createPostForBlog(mainBlog.id, {
      title: 'bla',
      content: 'bla',
      shortDescription: 'bla',
    });

    expect(createdPostRes.status).toBe(HttpStatus.CREATED);

    const deletePostRes = await blogApiManger.deletePostIdForBlog({
      blogId: mainBlog.id,
      postId: createdPostRes.body.id,
    });

    expect(deletePostRes.status).toBe(HttpStatus.NO_CONTENT);

    const getRemovedPost = await postApiManger.findById(createdPostRes.body.id);
    expect(getRemovedPost.status).toBe(HttpStatus.NOT_FOUND);
  });
});
