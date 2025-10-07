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

  it('Should be return 204 and Email was verified. Account was activated', async () => {
    const registerRes = await userTestManager.registrationUser(userAuthData);
    expect(registerRes.status).toBe(HttpStatus.NO_CONTENT);

    const User = await userRepository.findByEmailOrLogin(userAuthData.email);
    expect(User).not.toBeNull();

    const emailConfirmation = (await emailConfirmationRepository.findByUserId(
      User!.id as string,
    )) as unknown as EmailConfirmation;
    expect(emailConfirmation.isConfirmed).toBeFalsy();
    expect(typeof emailConfirmation.code).toBe('string');
    expect(emailConfirmation.expirationAt).toBeInstanceOf(Date);

    const confirmResponse = await request(app.getHttpServer())
      .post(PATH_URL_REG_CONFIRMATION)
      .send({ code: emailConfirmation.code });

    expect(confirmResponse.status).toBe(HttpStatus.NO_CONTENT);

    const emailConfirmed = (await emailConfirmationRepository.findByUserId(
      User!.id as string,
    )) as unknown as EmailConfirmation;

    expect(emailConfirmed.isConfirmed).toBeTruthy();
  });

  it(`should be return 400 if the code has already been confirmed`, async () => {
    const User = await userRepository.findByEmailOrLogin(userAuthData.email);
    const emailConfirEntity = (await emailConfirmationRepository.findByUserId(
      User!.id as string,
    )) as unknown as EmailConfirmation;

    expect(emailConfirEntity.isConfirmed).toBeTruthy();

    const confirmationRes = await request(app.getHttpServer())
      .post(PATH_URL_REG_CONFIRMATION)
      .send({ code: emailConfirEntity.code });

    expect(confirmationRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(confirmationRes.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'code', message: expect.any(String) }],
    });
  });

  it(`should be return 400 if confirmation code not existing`, async () => {
    const registerRes = await userTestManager.registrationUser({
      login: 'user1',
      email: 'user1@gmail.com',
      password: 'user123456',
    });
    expect(registerRes.status).toBe(HttpStatus.NO_CONTENT);

    const User = await userRepository.findByEmailOrLogin('user1@gmail.com');

    const emailConfirmation =
      (await emailConfirmationRepository.findByUserId(
        User!.id as string,
      )) as unknown as EmailConfirmation;

    expect(emailConfirmation.isConfirmed).toBeFalsy();

    const rejectConfirmResponse = await request(app.getHttpServer())
      .post(PATH_URL_REG_CONFIRMATION)
      .send({ code: randomUUID() });

    expect(rejectConfirmResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(rejectConfirmResponse.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'code', message: expect.any(String) }],
    });

    const emailConfirmed
      = (await emailConfirmationRepository.findByUserId(
      User!.id as string,
    )) as unknown as EmailConfirmation;

    expect(emailConfirmed.isConfirmed).toBeFalsy();
  });
  it('should be return 400 if recovery code invalid type (uuid)', async () => {
    const rejectConfirmResponse = await request(app.getHttpServer())
      .post(PATH_URL_REG_CONFIRMATION)
      .send({ code: '1355HHfasdf-asdfadfjk' });

    expect(rejectConfirmResponse.status).toBe(HttpStatus.BAD_REQUEST);

    expect(rejectConfirmResponse.body).toEqual({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });
  });
  it(`should be return 400 if code confirmation expired`, async () => {
    confirmConfig.emailExpiresInHours = -1;
    const registerRes = await userTestManager.registrationUser({
      login: 'user2',
      email: 'user2@gmail.com',
      password: 'user123456',
    });
    expect(registerRes.status).toBe(HttpStatus.NO_CONTENT);

    const User = await userRepository.findByEmailOrLogin('user2@gmail.com');

    const EmailConfirmationBeforeConfirm =
      await emailConfirmationRepository.findByUserId(User!.id as string);

    expect(EmailConfirmationBeforeConfirm!.isConfirmed).toBeFalsy();

    const rejectConfirmResponse = await request(app.getHttpServer())
      .post(PATH_URL_REG_CONFIRMATION)
      .send({ code: EmailConfirmationBeforeConfirm!.code });

    expect(rejectConfirmResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(rejectConfirmResponse.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'code', message: expect.any(String) }],
    });

    const EmailConfirmationAfterConfirm =
      await emailConfirmationRepository.findByUserId(User!.id as string);

    expect(EmailConfirmationAfterConfirm!.isConfirmed).toBeFalsy();
  });

  it('Should return 429 if more than 5 requests in 10 seconds', async () => {
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
    } else {
      console.info('ThrottlerConfig off');
    }
  });
});
