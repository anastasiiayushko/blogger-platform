import { HttpStatus, INestApplication } from '@nestjs/common';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { ApiErrorResultType } from '../type/response-super-test';
import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { UsersApiManagerHelper } from '../../api-manager/users-api-manager-helper';
import { UserRepository } from '../../../src/modules/user-accounts/infrastructure/user-repository';
import { UserViewDto } from '../../../src/modules/user-accounts/infrastructure/mapper/user-view-dto';
import { EmailConfirmationRepository } from '../../../src/modules/user-accounts/infrastructure/email-confirmation.repository';

describe('SaUserController  CREATED (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();

  let app: INestApplication;
  let userRepository: UserRepository;
  let emailConfirmationRepository: EmailConfirmationRepository;
  let userTestManger: UsersApiManagerHelper;

  beforeEach(async () => {
    const init = await setupNextAppHttp();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UserRepository>(UserRepository);
    emailConfirmationRepository = app.get<EmailConfirmationRepository>(
      EmailConfirmationRepository,
    );
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

  it('Should be return 201 and add new user to system. Default Account verified', async () => {
    const userView = await userTestManger.createSeveralUsers(1, basicAuth);

    expect(userView[0]).toMatchObject<UserViewDto>({
      id: expect.any(String),
      login: userView[0].login,
      email: userView[0].email,
      createdAt: expect.any(String),
    });

    const user = await userRepository.findById(userView[0].id);
    expect(user).not.toBeNull();
    const userId = user?.id as unknown as string;

    const emailConfirmation =
      await emailConfirmationRepository.findByUserId(userId);
    expect(emailConfirmation!.isConfirmed).toBeTruthy();
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
