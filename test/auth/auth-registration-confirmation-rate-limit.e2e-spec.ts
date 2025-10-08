import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import request from 'supertest';
import { randomUUID } from 'crypto';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { UserConfirmationConfig } from '../../src/modules/user-accounts/config/user-confirmation.config';
import { ApiErrorResultType } from '../type/response-super-test';
import { ThrottlerConfig } from '../../src/core/config/throttler.config';
import { UserRepository } from '../../src/modules/user-accounts/infrastructure/user-repository';
import { EmailConfirmationRepository } from '../../src/modules/user-accounts/infrastructure/email-confirmation.repository';
import { EmailConfirmation } from '../../src/modules/user-accounts/domin/email-confirmation.entity';
import { delay } from '../helpers/delay-helper';

describe('Auth /registration-confirmation', () => {
  const PATH_URL_REG_CONFIRMATION = '/api/auth/registration-confirmation';
  let app: INestApplication;
  let userRepository: UserRepository;
  let emailConfirmationRepository: EmailConfirmationRepository;
  let userTestManager: UsersApiManagerHelper;
  let confirmConfig: UserConfirmationConfig;
  let throttlerConfig: ThrottlerConfig;
  const userAuthData = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManager = init.userTestManger;
    throttlerConfig = app.get<ThrottlerConfig>(ThrottlerConfig);
    userRepository = app.get<UserRepository>(UserRepository);
    emailConfirmationRepository = app.get<EmailConfirmationRepository>(
      EmailConfirmationRepository,
    );
    confirmConfig = app.get<UserConfirmationConfig>(UserConfirmationConfig);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should return status code 429 if more than 5 requests were sent within 10 seconds, and 400 after waiting; status 429, 400;', async () => {
    if (throttlerConfig.enabled) {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post(PATH_URL_REG_CONFIRMATION)
          .send({ code: randomUUID() }); // Или другой эндпоинт
      }

      // Делаем еще один запрос, чтобы превысить лимит
      const res = await await request(app.getHttpServer())
        .post(PATH_URL_REG_CONFIRMATION)
        .send({ code: randomUUID() });

      // Проверяем, что статус 429 (слишком много запросов)
      expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
      await delay(3003);

      await request(app.getHttpServer())
        .post(PATH_URL_REG_CONFIRMATION)
        .send({ code: randomUUID() })
        .expect(HttpStatus.BAD_REQUEST);
    } else {
      console.info('ThrottlerConfig off');
    }
  });
});
