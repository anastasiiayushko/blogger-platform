import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { ApiErrorResultType } from '../type/response-super-test';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';

describe('UserController CREATED (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();

  let app: INestApplication;
  let userRepository: UsersRepository;
  let userTestManger: UsersApiManagerHelper;

  beforeEach(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UsersRepository>(UsersRepository);
  });
  afterAll(async () => {
    await app.close();
  });

  it('should be return 401 basic auth not valid', async () => {
    const userRes = await userTestManger.createUser(
      {
        email: 'test@test.com',
        password: 'password',
        login: 'login',
      },
      '',
    );
    expect(userRes.status).toBe(HttpStatus.UNAUTHORIZED);
  });

  it('Should be return 201 if valid header basic auth and correct data. Default Account verified', async () => {
    const userView = await userTestManger.createSeveralUsers(1, basicAuth);

    expect(userView[0]).toMatchObject<UserViewDto>({
      id: expect.any(String),
      login: userView[0].login,
      email: userView[0].email,
      createdAt: expect.any(String),
    });

    const userById = await userRepository.findById(userView[0].id);
    expect(userById!.emailConfirmation.isConfirmed).toBeTruthy();
  });

  it('Should return 400 error that the email field is already in the system', async () => {
    const userRes = await userTestManger.createUser(
      {
        email: 'test@test.com',
        password: 'password',
        login: 'login',
      },
      basicAuth,
    );
    expect(userRes.status).toBe(HttpStatus.CREATED);

    const userExistEmailRes = await userTestManger.createUser(
      {
        email: 'test@test.com',
        password: 'password',
        login: 'login2',
      },
      basicAuth,
    );
    expect(userExistEmailRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(userExistEmailRes.body).toMatchObject<ApiErrorResultType>({
      errorsMessages: [{ field: 'email', message: expect.any(String) }],
    });
  });

  it('Should return 400 error that the login field is already in the system', async () => {
    const userRes = await userTestManger.createUser(
      {
        email: 'test@test.com',
        password: 'password',
        login: 'login',
      },
      basicAuth,
    );
    expect(userRes.status).toBe(HttpStatus.CREATED);

    const userExistEmailRes = await userTestManger.createUser(
      {
        email: 'test1@test.com',
        password: 'password',
        login: 'login',
      },
      basicAuth,
    );
    expect(userExistEmailRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(userExistEmailRes.body).toMatchObject<ApiErrorResultType>({
      errorsMessages: [{ field: 'login', message: expect.any(String) }],
    });
  });
});
