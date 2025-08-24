import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { UsersSqlRepository } from '../../src/modules/user-accounts/infrastructure/sql/users.sql-repository';
import { UserSqlViewDto } from '../../src/modules/user-accounts/infrastructure/sql/mapper/users.sql-view-dto';
import { randomUUID } from 'crypto';

describe('UserController DELETE (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();

  let app: INestApplication;
  let userRepository: UsersSqlRepository;
  let userTestManger: UsersApiManagerHelper;
  let createdUser: UserSqlViewDto;

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UsersSqlRepository>(UsersSqlRepository);
    const userRes = await userTestManger.createUser(
      {
        email: 'test@test.com',
        password: 'password',
        login: 'login',
      },
      basicAuth,
    );
    expect(userRes.status).toBe(HttpStatus.CREATED);
    createdUser = userRes.body;
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should return 401 if invalid header basic auth', async () => {
    const response = await userTestManger.deleteById(createdUser.id, '');
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

    const user = await userRepository.findById(createdUser.id);
    expect(user).not.toBeNull();
  });

  it('Should be return 404 error if user by id not found', async () => {
    const response = await userTestManger.deleteById(randomUUID(), basicAuth);
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
  it('Should be 204 deleted existing user by id', async () => {
    const response = await userTestManger.deleteById(createdUser.id, basicAuth);
    expect(response.status).toBe(HttpStatus.NO_CONTENT);

    const user = await userRepository.findById(createdUser.id);
    expect(user).toBeNull();
  });

  it('Should be 400 if param not valid objectId type', async () => {
    const response = await userTestManger.deleteById('randomid', basicAuth);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
