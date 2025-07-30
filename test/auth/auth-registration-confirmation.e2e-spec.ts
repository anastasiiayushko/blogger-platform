import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { ConfigService } from '@nestjs/config';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';
import { randomUUID } from 'crypto';
import { delay } from '../helpers/delay-helper';

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

  it(`should be return 400 if the code has already been confirmed`, async () => {
    const userDoc = await userRepository.findByEmailOrLogin(userAuthData.email);
    expect(userDoc!.emailConfirmation.isConfirmed).toBeTruthy();

    const confirmationRes = await request(app.getHttpServer())
      .post('/api/auth/registration-confirmation')
      .send({ code: userDoc!.emailConfirmation.confirmationCode });

    expect(confirmationRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(confirmationRes.body).toEqual({
      errorsMessages: [{ field: 'code', message: expect.any(String) }],
    });
  });

  it(`should be return 400 if code confirmation invalid`, async () => {
    const registerRes = await userTestManager.registrationUser({
      login: 'user1',
      email: 'user1@gmail.com',
      password: 'user123456',
    });
    expect(registerRes.status).toBe(HttpStatus.NO_CONTENT);

    const confirmationRes = await request(app.getHttpServer())
      .post('/api/auth/registration-confirmation')
      .send({ code: randomUUID() });

    expect(confirmationRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(confirmationRes.body).toEqual({
      errorsMessages: [{ field: 'code', message: expect.any(String) }],
    });

    const userDoc = await userRepository.findByEmailOrLogin('user1@gmail.com');
    expect(userDoc!.emailConfirmation.isConfirmed).toBeFalsy();
  });

  it(`should be return 400 if code confirmation expired`, async () => {
    console.log('Регистрируем пользователя...');
    const registerRes = await userTestManager.registrationUser({
      login: 'user2',
      email: 'user2@gmail.com',
      password: 'user123456',
    });
    console.log('Регистрируемый пользователь завершён.');
    expect(registerRes.status).toBe(HttpStatus.NO_CONTENT);

    const userDoc = await userRepository.findByEmailOrLogin('user2@gmail.com');
    expect(userDoc!.emailConfirmation.isConfirmed).toBeFalsy();
    console.log('Получен пользователь:', userDoc);
    //
    // jest.useFakeTimers(); // Имитируем таймер
    // // // Перематываем время на 70 секунд вперед
    // jest.setSystemTime(Date.now() + 70_000);
    // ⏰ Мокаем системное время +70 сек
    // const now = Date.now();
    // jest.spyOn(global.Date, 'now').mockReturnValue(now + 100_000);

    await delay(500);
    console.log('Выполняем запрос подтверждения...');
    const confirmationRes = await request(app.getHttpServer())
      .post('/api/auth/registration-confirmation')
      .send({ code: userDoc!.emailConfirmation.confirmationCode });

    // jest.useRealTimers(); // Возвращаем нормальный таймер

    expect(confirmationRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(confirmationRes.body).toEqual({
      errorsMessages: [{ field: 'code', message: expect.any(String) }],
    });

    const userDoc2 = await userRepository.findByEmailOrLogin('user2@gmail.com');
    expect(userDoc2!.emailConfirmation.isConfirmed).toBeFalsy();
    // jest.spyOn(global.Date, 'now').mockRestore(); // Вернули как было
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
