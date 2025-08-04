import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { ConfigService } from '@nestjs/config';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';
import { randomUUID } from 'crypto';
import { delay } from '../helpers/delay-helper';
import * as process from 'node:process';

describe('Auth /registration-email-resending', () => {
  const ORIGINAL_ENV = process.env;
  let app: INestApplication;
  let userRepository: UsersRepository;
  let userTestManager: UsersTestManagerHelper;

  const userNika = {
    login: 'nika',
    email: 'test@gmail.com',
    password: 'nika123',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManager = init.userTestManger;
    userRepository = app.get<UsersRepository>(UsersRepository);
  });

  afterAll(async () => {
    process.env.EXPIRATION_DATE_MIN = ORIGINAL_ENV.EXPIRATION_DATE_MIN;
    await app.close();
  });

  it('should send email with new code if user exists but not confirmed yet; status 204.', async () => {
    const authRes = await userTestManager.registrationUser(userNika);
    expect(authRes.status).toBe(HttpStatus.NO_CONTENT);

    const userRes = await userRepository.findByEmailOrLogin(userNika.email);
    expect(userRes!.emailConfirmation.isConfirmed).toBeFalsy();

    const resendingRes = await request(app.getHttpServer())
      .post('/api/auth/registration-email-resending')
      .send({ email: userNika.email });
    expect(resendingRes.status).toBe(HttpStatus.NO_CONTENT);

    const userNewConfirmedCode = await userRepository.findByEmailOrLogin(
      userNika.email,
    );
    expect(userNewConfirmedCode!.emailConfirmation.isConfirmed).toBeFalsy();
    expect(
      userNewConfirmedCode!.emailConfirmation.confirmationCode,
    ).not.toEqual(userRes!.emailConfirmation.confirmationCode);

    const oldExpirationDate = new Date(
      userRes!.emailConfirmation.expirationDate,
    );
    const newExpirationDate = new Date(
      userNewConfirmedCode!.emailConfirmation.expirationDate,
    );

    expect(oldExpirationDate.getTime()).toBeLessThan(
      newExpirationDate.getTime(),
    );
  });

  it('Should be return 400 if account was activated', async () => {
    const user = await userRepository.findByEmailOrLogin(userNika.email);

    expect(user).not.toBeNull();
    expect(user!.emailConfirmation.isConfirmed).toBeFalsy();

    const confirmationRes = await request(app.getHttpServer())
      .post('/api/auth/registration-confirmation')
      .send({ code: user?.emailConfirmation.confirmationCode });

    expect(confirmationRes.status).toBe(HttpStatus.NO_CONTENT);

    const userConfirmed = await userRepository.findByEmailOrLogin(
      userNika.email,
    );

    expect(userConfirmed!.emailConfirmation.isConfirmed).toBeTruthy();

    const resendingRes = await request(app.getHttpServer())
      .post('/api/auth/registration-email-resending')
      .send({ email: userNika.email });

    expect(resendingRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(resendingRes.body).toEqual({
      errorsMessages: [{ field: 'email', message: expect.any(String) }],
    });
  });

  it('Should be return 400 if email not existing', async () => {
    const resendingRes = await request(app.getHttpServer())
      .post('/api/auth/registration-email-resending')
      .send({ email: 'noesiting@gmail.com' });

    expect(resendingRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(resendingRes.body).toEqual({
      errorsMessages: [{ field: 'email', message: expect.any(String) }],
    });
  });
});
