import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { GetUsersQueryParams } from '../../src/modules/user-accounts/api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { UsersSortBy } from '../../src/modules/user-accounts/api/input-dto/users-sort-by';
import { SortDirection } from '../../src/core/dto/base.query-params.input-dto';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { UsersSqlRepository } from '../../src/modules/user-accounts/infrastructure/sql/users.sql-repository';
import { UserSqlViewDto } from '../../src/modules/user-accounts/infrastructure/sql/mapper/users.sql-view-dto';

describe('UserController PAGINATION (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL = '/api/sa/users';

  let app: INestApplication;
  let userRepository: UsersSqlRepository;
  let userTestManger: UsersApiManagerHelper;
  let createdUsers: UserSqlViewDto[] = [];

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UsersSqlRepository>(UsersSqlRepository);
    createdUsers = await userTestManger.createSeveralUsers(10, basicAuth);
    console.log(createdUsers, 'createdUsers');
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
    const data: PaginatedViewDto<UserSqlViewDto[]> = response.body;
    console.log(data);
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
      .get(PATH_URL)
      .set('Authorization', basicAuth)
      .query(query);
    const data: PaginatedViewDto<UserSqlViewDto[]> = response.body;

    expect(data.pageSize).toBe(3);
    expect(data.page).toBe(2);
    expect(data.totalCount).toBe(10);
    expect(data.pagesCount).toBe(4);
    expect(data.items[0].email).toBe(createdUsers[3].email);
  });
});
