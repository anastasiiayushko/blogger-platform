import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { BlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import { randomUUID } from 'crypto';

describe('SaBlogController DELETE (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const blogInputDto: BlogInputDto = {
    name: 'string',
    description: 'string',
    websiteUrl: 'https://test-domain.com',
  };

  let createdBlogId: string;

  let app: INestApplication;
  let blogApiManger: BlogApiManager;

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    blogApiManger = new BlogApiManager(app);
    const createdBlogRes = await blogApiManger.create(blogInputDto, basicAuth);
    expect(createdBlogRes.status).toBe(HttpStatus.CREATED);
    createdBlogId = createdBlogRes.body.id;
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should be status 404 if blogId not existing', async () => {
    const deletedRes = await blogApiManger.deleteById(randomUUID());
    expect(deletedRes.status).toBe(HttpStatus.NOT_FOUND);

    const getAllBlogsRes = await blogApiManger.getById(createdBlogId);
    expect(getAllBlogsRes.status).toBe(HttpStatus.OK);
  });

  it('Should be status 401 if not Unauthorized', async () => {
    const deletedBlogRes = await blogApiManger.deleteById(
      createdBlogId,
      basicAuth + '56',
    );
    expect(deletedBlogRes.status).toBe(HttpStatus.UNAUTHORIZED);

    const getAllBlogsRes = await blogApiManger.getById(createdBlogId);
    expect(getAllBlogsRes.status).toBe(HttpStatus.OK);
  });

  it('Should be status 204', async () => {
    const deletedBlogRes = await blogApiManger.deleteById(createdBlogId);
    expect(deletedBlogRes.status).toBe(HttpStatus.NO_CONTENT);

    const getAllBlogsRes = await blogApiManger.getById(createdBlogId);

    expect(getAllBlogsRes.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should be status 404 check soft-delete for post if soft-deleted blog', async () => {
    const createdBlogRes = await blogApiManger.create(
      {
        description: 'bla-bla',
        name: 'bla-bla',
        websiteUrl: 'https://test-domain.com',
      },
      basicAuth,
    );

    expect(createdBlogRes.status).toBe(HttpStatus.CREATED);

    const createdPosts = await blogApiManger.createServerlPostsForBlog(
      createdBlogRes.body.id,
      3,
    );

    const deletedBlogRes = await blogApiManger.deleteById(
      createdBlogRes.body.id,
    );
    expect(deletedBlogRes.status).toBe(HttpStatus.NO_CONTENT);

    const allPostsByBlogId =
      await blogApiManger.getPostsWithPagingByParamBlogId(
        createdBlogRes.body.id,
      );
    expect(allPostsByBlogId.status).toBe(HttpStatus.NOT_FOUND);
  });
});
