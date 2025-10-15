import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { UserViewDto } from '../../src/modules/user-accounts/infrastructure/mapper/user-view-dto';

describe('UserController PAGINATION (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL = '/api/sa/users';

  let app: INestApplication;
  let userTestManger: UsersApiManagerHelper;
  let createdUsers: UserViewDto[] = [];

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
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
    const data = response.body as PaginatedViewDto<UserViewDto[]>;
    expect(data.pageSize).toBe(10);
    expect(data.page).toBe(1);
    expect(data.totalCount).toBe(10);
    expect(data.pagesCount).toBe(1);

    expect(data.items[0]).toEqual<UserViewDto>({
      email: expect.any(String) as unknown as string,
      login: expect.any(String) as unknown as string,
      id: expect.any(String) as unknown as string,
      createdAt: expect.any(String) as unknown as string,
    });
  });

  it('Should be return correct sort by login with direction asc', async () => {
    // const query: Partial<GetUsersQueryParams> = {
    //   pageSize: 10,
    //   pageNumber: 1,
    //   sortBy: UsersSortBy.Login,
    //   // @ts-expect-error
    //   sortDirection: 'asc',
    // };
    // const response = await request(app.getHttpServer())
    //   .get(PATH_URL)
    //   .set('Authorization', basicAuth)
    //   .query(query);
    //
    // const data: PaginatedViewDto<UserViewDto[]> = response.body;
    //
    // const sortedUserByLoginAsc = createdUsers.sort((a, b) =>
    //   a.login.localeCompare(b.login),
    // );
    //
    // expect(data.items).toEqual(sortedUserByLoginAsc);
  });

  it('Should be return 200 if query params invalid', async () => {});
});
