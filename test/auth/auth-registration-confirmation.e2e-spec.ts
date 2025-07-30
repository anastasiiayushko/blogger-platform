import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { ConfigService } from '@nestjs/config';

describe('Auth /registration-confirmation', () => {
  let app: INestApplication;
  let userRepository: UsersRepository;
  let configService: ConfigService;

  const userAuthData = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userRepository = app.get<UsersRepository>(UsersRepository);
    configService = app.get<ConfigService>(ConfigService);

    const userRes = await request(app.getHttpServer())
      .post('/api/auth/registration')
      .send(userAuthData);
    expect(userRes.status).toBe(HttpStatus.NO_CONTENT);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should be return 204 and Email was verified. Account was activated', async () => {
    const userDoc = await userRepository.findByEmailOrLogin(userAuthData.email);
    expect(userDoc).not.toBeNull();
    expect(userDoc!.emailConfirmation.isConfirmed).toBeFalsy();
    expect(typeof userDoc!.emailConfirmation.confirmationCode).toBe('string');
    expect(userDoc!.emailConfirmation.expirationDate).toBeInstanceOf(Date);
    console.log(userDoc);
  });

  it('Should be return 400  if the user with the given email or login already exists ', async () => {});

  it('Should be return 400  if the  login no exists ', async () => {});

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
