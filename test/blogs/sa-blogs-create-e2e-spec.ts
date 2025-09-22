import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../helpers/common-helpers';
import { BlogApiManager } from '../helpers/api-manager/blog-api-manager';
import { BlogInputDto } from '../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import { randomUUID } from 'crypto';
import {
  blogDescriptionConstraints,
  blogNameConstraints,
} from '../../src/modules/bloggers-platform/blogs/domain/blog-constraints';

describe('SaBlogController CREATED (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const blogInputDto: BlogInputDto = {
    name: 'string',
    description: 'string',
    websiteUrl: 'https://test-domain.com',
  };

  let app: INestApplication;
  let blogApiManger: BlogApiManager;

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    blogApiManger = new BlogApiManager(app);
  });
  afterAll(async () => {
    await app.close();
  });
  it('Create blog invalid basic auth. should be status 401', async () => {
    const createdBlogRes = await blogApiManger.create(
      blogInputDto,
      randomUUID(),
    );
    expect(createdBlogRes.status).toBe(HttpStatus.UNAUTHORIZED);

    const getAllBlogsRes = await blogApiManger.getAllBlogs();

    expect(getAllBlogsRes.status).toBe(HttpStatus.OK);
    expect(getAllBlogsRes.body.items).toEqual([]);
  });

  it('Create blog incorrect empty data, should be errorsMessage and status 400', async () => {
    const createBlogResponse = await blogApiManger.create(
      {
        name: '',
        description: '',
        websiteUrl: '',
      },
      basicAuth,
    );

    expect(createBlogResponse.body).toMatchObject({
      errorsMessages: expect.arrayContaining([
        expect.objectContaining({ message: expect.any(String), field: 'name' }),
        expect.objectContaining({
          message: expect.any(String),
          field: 'description',
        }),
        expect.objectContaining({
          message: expect.any(String),
          field: 'websiteUrl',
        }),
      ]),
    });
    expect(createBlogResponse.status).toBe(HttpStatus.BAD_REQUEST);

    const blogsResponse = await blogApiManger.getAllBlogs();

    expect(blogsResponse.status).toBe(HttpStatus.OK);
    expect(blogsResponse.body.items).toEqual([]);
  });

  it('Create incorrect field name empty, should be errorsMessage and status 400', async () => {
    const createBlogResponse = await blogApiManger.create({
      ...blogInputDto,
      name: '',
    });
    expect(createBlogResponse.body).toEqual({
      errorsMessages: [{ message: expect.any(String), field: 'name' }],
    });
    expect(createBlogResponse.status).toBe(HttpStatus.BAD_REQUEST);
    const blogsResponse = await blogApiManger.getAllBlogs();

    expect(blogsResponse.status).toBe(HttpStatus.OK);
    expect(blogsResponse.body.items).toEqual([]);
  });

  it('Create incorrect field name more than maxLen 15, should be errorsMessage and status 400', async () => {
    let nameMax = generateRandomStringForTest(
      blogNameConstraints.maxLength + 1,
    );
    const createBlogResponse = await blogApiManger.create({
      ...blogInputDto,
      name: nameMax,
    });
    expect(createBlogResponse.body).toEqual({
      errorsMessages: [{ message: expect.any(String), field: 'name' }],
    });
    expect(createBlogResponse.status).toBe(HttpStatus.BAD_REQUEST);
    const blogsResponse = await blogApiManger.getAllBlogs();

    expect(blogsResponse.status).toBe(HttpStatus.OK);
    expect(blogsResponse.body.items.length).toBe(0);
  });

  it('Create data incorrect field description more then maxLen 500, should be errorsMessage and status 400', async () => {
    const descriptionMax = generateRandomStringForTest(
      blogDescriptionConstraints.maxLength + 1,
    );
    const createdResponse = await blogApiManger.create({
      ...blogInputDto,
      description: descriptionMax,
    });
    expect(createdResponse.body).toEqual({
      errorsMessages: [{ message: expect.any(String), field: 'description' }],
    });
    expect(createdResponse.status).toBe(HttpStatus.BAD_REQUEST);
    const blogsResponse = await blogApiManger.getAllBlogs();

    expect(blogsResponse.status).toBe(HttpStatus.OK);
    expect(blogsResponse.body.items.length).toBe(0);
  });

  it('Create data incorrect field description empty, should be errorsMessage and status 400', async () => {
    const createBlogResponse = await blogApiManger.create({
      ...blogInputDto,
      description: ' ',
    });
    expect(createBlogResponse.body).toEqual({
      errorsMessages: [{ message: expect.any(String), field: 'description' }],
    });
    expect(createBlogResponse.status).toBe(HttpStatus.BAD_REQUEST);
    const blogsResponse = await blogApiManger.getAllBlogs();

    expect(blogsResponse.status).toBe(HttpStatus.OK);
    expect(blogsResponse.body.items.length).toBe(0);
  });

  it('Create data incorrect field websiteUrl empty, should be errorsMessage and status 400', async () => {
    const createBlogResponse = await blogApiManger.create({
      ...blogInputDto,
      websiteUrl: ' ',
    });
    expect(createBlogResponse.body).toEqual({
      errorsMessages: [{ message: expect.any(String), field: 'websiteUrl' }],
    });
    expect(createBlogResponse.status).toBe(HttpStatus.BAD_REQUEST);
    const blogsResponse = await blogApiManger.getAllBlogs();

    expect(blogsResponse.status).toBe(HttpStatus.OK);
    expect(blogsResponse.body.items.length).toBe(0);
  });

  it('Returns the newly created blog and 201 status', async () => {
    const blogBody = {
      name: 'blog name',
      description: 'description should not be empty',
      websiteUrl: 'https://blog.codinghorror.com/',
    };
    const createResponse = await blogApiManger.create(blogBody, basicAuth);
    expect(createResponse.status).toBe(HttpStatus.CREATED);
    expect(createResponse.body).toMatchObject({
      id: expect.any(String),
      name: blogBody.name,
      description: blogBody.description,
      websiteUrl: blogBody.websiteUrl,
      createdAt: expect.any(String),
      isMembership: false,
    });

    const findBlogResponse = await blogApiManger.findById(
      createResponse.body!.id as unknown as string,
    );
    expect(findBlogResponse.status).toBe(HttpStatus.OK);
    expect(findBlogResponse.body).toMatchObject({
      id: expect.any(String),
      name: blogBody.name,
      description: blogBody.description,
      websiteUrl: blogBody.websiteUrl,
      createdAt: expect.any(String),
      isMembership: false,
    });
  });
});
