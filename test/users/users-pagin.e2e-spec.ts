import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';
import request from 'supertest';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { UsersSortBy } from '../../src/modules/user-accounts/api/input-dto/users-sort-by';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';

describe('UserController PAGINATION (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();

  let app: INestApplication;
  let userRepository: UsersRepository;
  let userTestManger: UsersTestManagerHelper;
  let createdUsers: UserViewDto[] = [];

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UsersRepository>(UsersRepository);
    createdUsers = await userTestManger.createSeveralUsers(10, basicAuth);
    expect(createdUsers.length).toBe(10);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should return 401', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', 'no:valid');
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should be return list users and paging data', async () => {
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .query({})
      .set('Authorization', basicAuth)
      .expect(HttpStatus.OK);
    const data: PaginatedViewDto<UserViewDto[]> = response.body;

    expect(data.pageSize).toBe(10);
    expect(data.page).toBe(1);
    expect(data.totalCount).toBe(10);
    expect(data.pagesCount).toBe(1);
    expect(data.items[9].email).toBe(createdUsers[0].email);
  });

  it('Should be return correct data page with paging', async () => {
    const query: Partial<GetUsersQueryParams> = {
      pageSize: 3,
      pageNumber: 2,
      sortBy: UsersSortBy.CreatedAt,
      sortDirection: SortDirection.Asc,
    };
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', basicAuth)
      .query(query);
    const data: PaginatedViewDto<UserViewDto[]> = response.body;

    expect(data.pageSize).toBe(3);
    expect(data.page).toBe(2);
    expect(data.totalCount).toBe(10);
    expect(data.pagesCount).toBe(4);
    expect(data.items[0].email).toBe(createdUsers[3].email);
  });
});
