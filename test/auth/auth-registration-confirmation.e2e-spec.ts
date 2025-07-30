import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { ConfigService } from '@nestjs/config';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';

describe('Auth /registration-confirmation', () => {
  const ORIGINAL_ENV = process.env;
  let app: INestApplication;
  let userRepository: UsersRepository;
  let configService: ConfigService;
  let userTestManager: UsersTestManagerHelper;

  const userAuthData = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
      const init = await initSettings();
      app = init.app;

    userTestManager = init.userTestManger;
    userRepository = app.get<UsersRepository>(UsersRepository);
    configService = app.get<ConfigService>(ConfigService);
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be return 204 and Email was verified. Account was activated', async () => {
    const registerRes = await userTestManager.registrationUser(userAuthData);
    expect(registerRes.status).toBe(HttpStatus.NO_CONTENT);

    const userDoc = await userRepository.findByEmailOrLogin(userAuthData.email);
    expect(userDoc).not.toBeNull();
    expect(userDoc!.emailConfirmation.isConfirmed).toBeFalsy();
    expect(typeof userDoc!.emailConfirmation.confirmationCode).toBe('string');
    expect(userDoc!.emailConfirmation.expirationDate).toBeInstanceOf(Date);

    const confirmationRes = await request(app.getHttpServer())
      .post('/api/auth/registration-confirmation')
      .send({ code: userDoc!.emailConfirmation.confirmationCode });

    expect(confirmationRes.status).toBe(HttpStatus.NO_CONTENT);
    const confirmUserDoc = await userRepository.findByEmailOrLogin(
      userAuthData.email,
    );
    expect(confirmUserDoc!.emailConfirmation.isConfirmed).toBeTruthy();
  });

  it( `should be return 400 if the code has already been confirmed`, async () => {

  });

  it(`If the confirmation code is incorrect, expired or already been applied`, async () => {});

  // it('Should return 429 if more than 5 requests in 10 seconds', async () => {
  //
  //   for (let i = 0; i < 5; i++) {
  //     await authRequests.authRegistration(userNika); // Или другой эндпоинт
  //   }
  //
  //   // Делаем еще один запрос, чтобы превысить лимит
  //   const res = await authRequests.authRegistration(userNika);
  //
  //   // Проверяем, что статус 429 (слишком много запросов)
  //   expect(res.status).toBe(StatusCode.MANY_REQUEST_429);
  // });
});
