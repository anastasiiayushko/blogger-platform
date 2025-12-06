import { HttpStatus, INestApplication } from '@nestjs/common';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { BlogApiManager } from '../../api-manager/blog-api-manager';
import { BlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import { PaginatedViewDto } from '../../../src/core/dto/base.paginated.view-dto';
import { BlogViewDto } from '../../../src/modules/bloggers-platform/blogs/api/view-dto/blog.view-dto';
import { BlogSortByEnum } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/get-blogs-query-params.input-dto';
import { SortDirection } from '../../../src/core/dto/base.query-params.input-dto';

describe('SaBlogController PAGING (e2e) ', () => {
  let severalBlogs: BlogInputDto[];

  let app: INestApplication;
  let blogApiManger: BlogApiManager;

  beforeAll(async () => {
    const init = await setupNextAppHttp();
    app = init.app;
    blogApiManger = new BlogApiManager(app);

    severalBlogs = await blogApiManger.createSeveralBlogs(15);
    expect(severalBlogs.length).toBe(15);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Unauthorized', async () => {
    const blogsRes = await blogApiManger.saGetAllBlogs(
      {},
      getAuthHeaderBasicTest('test:1245'),
    );
    expect(blogsRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should be returns blog paging is default query params', async () => {
    const blogsRes = await blogApiManger.saGetAllBlogs();
    expect(blogsRes.status).toBe(HttpStatus.OK);

    const pagingBlogs = blogsRes.body as PaginatedViewDto<BlogViewDto[]>;

    expect(pagingBlogs.totalCount).toBe(15);
    expect(pagingBlogs.pageSize).toBe(10);
    expect(pagingBlogs.page).toBe(1);
    expect(pagingBlogs.items.length).toBe(10);
  });

  it('Should be returns pageSize=5 and sorted createdAt asc', async () => {
    const blogsRes = await blogApiManger.saGetAllBlogs({
      pageSize: 5,
      sortBy: BlogSortByEnum.createAt,
      sortDirection: SortDirection.Asc,
    });

    expect(blogsRes.status).toBe(HttpStatus.OK);

    const pagingBlogs = blogsRes.body as PaginatedViewDto<BlogViewDto[]>;

    expect(pagingBlogs.totalCount).toBe(15);
    expect(pagingBlogs.pagesCount).toBe(Math.floor(15 / 5));
    expect(pagingBlogs.pageSize).toBe(5);
    expect(pagingBlogs.page).toBe(1);

    const blogs = severalBlogs.slice(0, 5);

    expect(pagingBlogs.items).toEqual(blogs);
  });

  it('Should be returns current item by searchNameTerm ', async () => {
    const blogsRes = await blogApiManger.saGetAllBlogs({
      pageSize: 5,
      searchNameTerm: severalBlogs[0].name,
    });
    expect(blogsRes.status).toBe(HttpStatus.OK);

    const pagingBlogs = blogsRes.body as PaginatedViewDto<BlogViewDto[]>;

    expect(pagingBlogs.pageSize).toBe(5);
    expect(pagingBlogs.totalCount).toBe(1);
    expect(pagingBlogs.pagesCount).toBe(1);
    expect(pagingBlogs.page).toBe(1);
    expect(pagingBlogs.items[0]).toMatchObject(severalBlogs[0]);
  });
});
