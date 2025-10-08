import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { ThrottlerConfig } from '../../src/core/config/throttler.config';
import { UserRepository } from '../../src/modules/user-accounts/infrastructure/user-repository';
import { delay } from '../helpers/delay-helper';

describe('Auth /registration with rate limiting', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL_REGISTRATION = '/api/auth/registration';
  let app: INestApplication;
  let throttlerConfig: ThrottlerConfig;
  let userTestManger: UsersApiManagerHelper;
  let userRepository: UserRepository;

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    throttlerConfig = app.get<ThrottlerConfig>(ThrottlerConfig);
    userTestManger = init.userTestManger;
    userRepository = app.get<UserRepository>(UserRepository);
  });
  afterAll(async () => {
    await app.close();
  });

  it('should return status code 429 if more than 5 requests were sent within 10 seconds, and 204 after waiting; status 429, 204;', async () => {
    const userOne = {
      email: 'userone@gmail.com',
      login: 'new-user',
      password: 'test123456',
    };
    if (throttlerConfig.enabled) {
      for (let i = 0; i < 5; i++) {
        await userTestManger.registrationUser({
          email: `user${i}0@gmail.com`,
          login: `user${i}`,
          password: 'test123456',
        }); // Или другой эндпоинт
      }

      // Делаем еще один запрос, чтобы превысить лимит
      const registerReject = await userTestManger.registrationUser({
        login: 'user100',
        email: 'user100@gmail.com',
        password: 'test123456',
      });

      // Проверяем, что статус 429 (слишком много запросов)
      expect(registerReject.status).toBe(HttpStatus.TOO_MANY_REQUESTS);

      await delay(3003);

      // Делаем еще один запрос, чтобы превысить лимит
      const res = await userTestManger.registrationUser({
        login: 'userSa',
        email: 'userSa@gmail.com',
        password: 'test123456',
      });

      // Проверяем, что статус 429 (слишком много запросов)
      expect(res.status).toBe(HttpStatus.NO_CONTENT);
    } else {
      console.info('ThrottlerConfig off');
    }
  });
});
