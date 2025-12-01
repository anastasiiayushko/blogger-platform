import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../../helpers/init-setting';
import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../../helpers/common-helpers';
import { BlogApiManager } from '../../helpers/api-manager/blog-api-manager';
import { BlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import { randomUUID } from 'crypto';
import { blogNameConstraints } from '../../../src/modules/bloggers-platform/blogs/domain/blog-constraints';
import { ApiErrorResultType } from '../type/response-super-test';

describe('SaBlogController UPDATE (e2e) ', () => {
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

  it('Should be status 204, and success updated blog', async () => {
    const updateBody: BlogInputDto = {
      name: 'blogger',
      websiteUrl: blogInputDto.websiteUrl,
      description: blogInputDto.description,
    };
    const updatedBlogRes = await blogApiManger.update(
      createdBlogId,
      updateBody,
    );
    expect(updatedBlogRes.status).toBe(HttpStatus.NO_CONTENT);

    const getAllBlogsRes = await blogApiManger.getById(createdBlogId);

    expect(getAllBlogsRes.status).toBe(HttpStatus.OK);

    expect(getAllBlogsRes.body).toMatchObject({
      id: createdBlogId,
      name: updateBody.name,
      description: updateBody.description,
      websiteUrl: updateBody.websiteUrl,
      createdAt: expect.any(String),
      isMembership: false,
    });
  });

  it('Should be status 404 if blogId not existing', async () => {
    const updateBody: BlogInputDto = {
      name: 'blog2',
      websiteUrl: blogInputDto.websiteUrl,
      description: blogInputDto.description,
    };

    const updatedBlogRes = await blogApiManger.update(randomUUID(), updateBody);
    expect(updatedBlogRes.status).toBe(HttpStatus.NOT_FOUND);

    const getAllBlogsRes = await blogApiManger.getById(createdBlogId);
    expect(getAllBlogsRes.status).toBe(HttpStatus.OK);
    expect(getAllBlogsRes.body.name).not.toEqual('blog2');
  });

  it('Should be status 401 if not Unauthorized', async () => {
    const updateBody: BlogInputDto = {
      name: 'update',
      websiteUrl: blogInputDto.websiteUrl,
      description: blogInputDto.description,
    };
    const updatedBlogRes = await blogApiManger.update(
      createdBlogId,
      updateBody,
      basicAuth + '56',
    );
    expect(updatedBlogRes.status).toBe(HttpStatus.UNAUTHORIZED);
    const getAllBlogsRes = await blogApiManger.getById(createdBlogId);
    expect(getAllBlogsRes.status).toBe(HttpStatus.OK);
    expect(getAllBlogsRes.body.name).not.toEqual('update');
  });

  it('should be 400 If the inputModel has incorrect values', async () => {
    const updateBody: BlogInputDto = {
      name: generateRandomStringForTest(blogNameConstraints.maxLength + 1),
      websiteUrl: blogInputDto.websiteUrl,
      description: blogInputDto.description,
    };

    const updatedBlogRes = await blogApiManger.update(
      createdBlogId,
      updateBody,
      basicAuth,
    );

    expect(updatedBlogRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(updatedBlogRes.body).toMatchObject<ApiErrorResultType>({
      errorsMessages: [
        {
          field: 'name',
          message: expect.any(String),
        },
      ],
    });
  });
});
