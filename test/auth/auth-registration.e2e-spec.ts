import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';

describe('Auth /registration', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersTestManagerHelper;
  let userRepository: UsersRepository;

  const existingUser = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };
  const newUser = {
    email: 'new@test.com',
    login: 'new-user',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UsersRepository>(UsersRepository);
    const userRes = await userTestManger.createUser(existingUser, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should be return 204 create user and send email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/registration')
      .send(newUser);
    expect(res.status).toBe(HttpStatus.NO_CONTENT);
    const userDoc = await userRepository.findByEmailOrLogin(newUser.email);
    expect(userDoc).not.toBeNull();
    expect(userDoc!.emailConfirmation.isConfirmed).toBeFalsy();
    expect(typeof userDoc!.emailConfirmation.confirmationCode).toBe('string');
    expect(userDoc!.emailConfirmation.expirationDate).toBeInstanceOf(Date);
  });

  it('Should be return 400  if the user with the given email or login already exists ', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/registration')
      .send({
        email: existingUser.email,
        login: 'new-user-login',
        password: 'password123',
      });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.errorsMessages).toEqual([
      { field: expect.any(String), message: expect.any(String) },
    ]);
  });

  it('Should be return 400  if the  login no exists ', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/registration')
      .send({
        email: 'new@test.com',
        login: existingUser.login,
        password: 'password123',
      });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.errorsMessages).toEqual([
      { field: expect.any(String), message: expect.any(String) },
    ]);
  });

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
