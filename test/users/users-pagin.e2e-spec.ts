import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { UsersSortBy } from '../../src/modules/user-accounts/api/input-dto/users-sort-by';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { UserRepository } from '../../src/modules/user-accounts/infrastructure/user-repository';
import { UserViewDto } from '../../src/modules/user-accounts/infrastructure/mapper/user-view-dto';

describe('UserController PAGINATION (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL = '/api/sa/users';

  let app: INestApplication;
  let userRepository: UserRepository;
  let userTestManger: UsersApiManagerHelper;
  let createdUsers: UserViewDto[] = [];

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UserRepository>(UserRepository);
    createdUsers = await userTestManger.createSeveralUsers(10, basicAuth);
    expect(createdUsers.length).toBe(10);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should return 401', async () => {
    const response = await request(app.getHttpServer())
      .get(PATH_URL)
      .set('Authorization', 'no:valid');
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should be return list users and paging data', async () => {
    const response = await request(app.getHttpServer())
      .get(PATH_URL)
      .query({})
      .set('Authorization', basicAuth)
      .expect(HttpStatus.OK);
    const data: PaginatedViewDto<UserViewDto[]> = response.body;
    expect(data.pageSize).toBe(10);
    expect(data.page).toBe(1);
    expect(data.totalCount).toBe(10);
    expect(data.pagesCount).toBe(1);
    expect(data.items[9].email).toBe(createdUsers[0].email);

    expect(data.items[0]).toEqual({
      email: expect.any(String),
      login: expect.any(String),
      id: expect.any(String),
      createdAt: expect.any(String),
    });
  });

  it('Should be return correct data page with paging', async () => {
    const query: Partial<GetUsersQueryParams> = {
      pageSize: 10,
      pageNumber: 1,
      sortBy: UsersSortBy.Login,
      sortDirection: SortDirection.Asc,
    };
    const response = await request(app.getHttpServer())
      .get(PATH_URL)
      .set('Authorization', basicAuth)
      .query(query);
    const data: PaginatedViewDto<UserViewDto[]> = response.body;
  });
});
