import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../../helpers/init-setting';
import request from 'supertest';
import { UsersApiManagerHelper } from '../../helpers/api-manager/users-api-manager-helper';
import { ApiErrorResultType } from '../type/response-super-test';
import { ThrottlerConfig } from '../../../src/core/config/throttler.config';
import { EmailConfirmationRepository } from '../../../src/modules/user-accounts/infrastructure/email-confirmation.repository';
import { UserRepository } from '../../../src/modules/user-accounts/infrastructure/user-repository';

describe('Auth /registration-email-resending', () => {
  let app: INestApplication;
  let throttlerConfig: ThrottlerConfig;
  let userRepository: UserRepository;
  let userTestManager: UsersApiManagerHelper;
  let emailConfirmationRepository: EmailConfirmationRepository;

  const userNika = {
    login: 'nika',
    email: 'test@gmail.com',
    password: 'nika123',
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
  });

  afterAll(async () => {
    await app.close();
  });

  it('should send email with new code if user exists but not confirmed yet; status 204.', async () => {
    const authRes = await userTestManager.registrationUser(userNika);
    expect(authRes.status).toBe(HttpStatus.NO_CONTENT);

    const User = await userRepository.findByEmailOrLogin(userNika.email);
    const emailConfirmation = await emailConfirmationRepository.findByUserId(
      User!.id as string,
    );
    expect(emailConfirmation!.isConfirmed).toBeFalsy();

    const resendingRes = await request(app.getHttpServer())
      .post('/api/auth/registration-email-resending')
      .send({ email: userNika.email });

    expect(resendingRes.status).toBe(HttpStatus.NO_CONTENT);

    const EmailConfirmationResending =
      await emailConfirmationRepository.findByUserId(User!.id as string);

    expect(EmailConfirmationResending!.isConfirmed).toBeFalsy();

    expect(emailConfirmation!.code).not.toEqual(
      EmailConfirmationResending!.code,
    );

    const oldExpirationDate = new Date(emailConfirmation!.expirationAt);
    const newExpirationDate = new Date(
      EmailConfirmationResending!.expirationAt,
    );

    expect(oldExpirationDate.getTime()).toBeLessThan(
      newExpirationDate.getTime(),
    );
  });

  it('Should be return 400 if account was activated', async () => {
    const User = await userRepository.findByEmailOrLogin(userNika.email);
    const emailConfirmation = await emailConfirmationRepository.findByUserId(
      User!.id as string,
    );
    expect(emailConfirmation!.isConfirmed).toBeFalsy();

    const confirmationRes = await request(app.getHttpServer())
      .post('/api/auth/registration-confirmation')
      .send({ code: emailConfirmation!.code });

    expect(confirmationRes.status).toBe(HttpStatus.NO_CONTENT);

    const EmailConfirmed = await emailConfirmationRepository.findByUserId(
      User!.id as string,
    );

    expect(EmailConfirmed!.isConfirmed).toBeTruthy();

    const resendingRes = await request(app.getHttpServer())
      .post('/api/auth/registration-email-resending')
      .send({ email: userNika.email });

    expect(resendingRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(resendingRes.body).toEqual<ApiErrorResultType>({
      errorsMessages: [{ field: 'email', message: expect.any(String) }],
    });
  });

  it('Should be return 400 if email not existing (protected brute force attack - not use)', async () => {
    const resendingRes = await request(app.getHttpServer())
      .post('/api/auth/registration-email-resending')
      .send({ email: 'noesiting@gmail.com' });

    expect(resendingRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(resendingRes.body).toEqual<ApiErrorResultType>({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });
  });

  it('Should be return 429 if than 5 attempts from one IP-address during 10 seconds ', async () => {
    if (throttlerConfig.enabled) {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/registration-email-resending')
          .send({ email: `noesiting${i}@gmail.com` });
      }

      const resManyAttempts = await request(app.getHttpServer())
        .post('/api/auth/registration-email-resending')
        .send({ email: `noesiting@gmail.com` });

      expect(resManyAttempts.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    } else {
      console.info('ThrottlerConfig off');
    }
  });
});
