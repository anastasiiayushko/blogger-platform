import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../helpers/common-helpers';
import request from 'supertest';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { randomUUID } from 'crypto';
import { ApiErrorResultType } from '../type/response-super-test';
import { UserConfirmationConfig } from '../../src/modules/user-accounts/config/user-confirmation.config';
import { ThrottlerConfig } from '../../src/core/config/throttler.config';
import { passwordConstraints } from '../../src/modules/user-accounts/domin/user.constraints';
import { UserRepository } from '../../src/modules/user-accounts/infrastructure/user-repository';
import { PasswordRecoveryRepository } from '../../src/modules/user-accounts/infrastructure/password-recovery.repository';

describe('Auth /new-password', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL_RECOVERY_PASS = `/api/auth/password-recovery`;
  const PATH_URL_NEW_PASS = `/api/auth/new-password`;
  let app: INestApplication;
  let throttlerConfig: ThrottlerConfig;
  let userTestManger: UsersApiManagerHelper;
  let userRepository: UserRepository;
  let passRecoveryRepository: PasswordRecoveryRepository;
  let confirmationConfig: UserConfirmationConfig;
  let registeredUserId: string;

  const infoRegisteredUser = {
    email: 'supertest@gmail.com',
    login: 'supertest',
    password: 'supertest123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    throttlerConfig = app.get<ThrottlerConfig>(ThrottlerConfig);

    userTestManger = init.userTestManger;
    confirmationConfig = app.get<UserConfirmationConfig>(
      UserConfirmationConfig,
    );
    userRepository = app.get<UserRepository>(UserRepository);
    passRecoveryRepository = app.get<PasswordRecoveryRepository>(
      PasswordRecoveryRepository,
    );
    const userRes = await userTestManger.createUser(
      infoRegisteredUser,
      basicAuth,
    );
    expect(userRes.status).toBe(HttpStatus.CREATED);
    registeredUserId = userRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be return status 204 If code is valid and new password is accepted', async () => {
    const userBeforeUpdatePass =
      await userRepository.findById(registeredUserId);

    const recoveryPassResponse = await request(app.getHttpServer())
      .post(PATH_URL_RECOVERY_PASS)
      .send({ email: infoRegisteredUser.email });

    expect(recoveryPassResponse.status).toBe(HttpStatus.NO_CONTENT);

    const recoveryPassNotConfirmed =
      await passRecoveryRepository.findByUserId(registeredUserId);
    expect(recoveryPassNotConfirmed!.isConfirmed).toBeFalsy();

    const newPasswordResponse = await request(app.getHttpServer())
      .post(PATH_URL_NEW_PASS)
      .send({
        newPassword: generateRandomStringForTest(passwordConstraints.minLength),
        recoveryCode: recoveryPassNotConfirmed!.code,
      });

    expect(newPasswordResponse.status).toBe(HttpStatus.NO_CONTENT);

    const recoveryPasswordConfirm =
      await passRecoveryRepository.findByUserId(registeredUserId);
    expect(recoveryPasswordConfirm!.isConfirmed).toBeTruthy();

    const userAfterUpdatePass = await userRepository.findById(registeredUserId);

    expect(userAfterUpdatePass?.password).not.toBe(
      userBeforeUpdatePass?.password,
    );
  });

  it('should be 400 if has incorrect value (for incorrect password length)', async () => {
    const userBeforeUpdatePass =
      await userRepository.findById(registeredUserId);

    const newPassword = {
      newPassword: generateRandomStringForTest(
        passwordConstraints.minLength - 1,
      ),
      recoveryCode: randomUUID(),
    };
    const rejectResponse = await request(app.getHttpServer())
      .post(PATH_URL_NEW_PASS)
      .send(newPassword);

    expect(rejectResponse.status).toBe(HttpStatus.BAD_REQUEST);

    expect(rejectResponse.body).toEqual<ApiErrorResultType>({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });

    const userAfterUpdatePass = await userRepository.findById(registeredUserId);

    expect(userAfterUpdatePass?.password).toBe(userBeforeUpdatePass?.password);
  });

  it('should be 400 if has incorrect value (or RecoveryCode is incorrect)', async () => {
    const userBeforeUpdatePass =
      await userRepository.findById(registeredUserId);

    const newPassword = {
      newPassword: generateRandomStringForTest(passwordConstraints.minLength),
      recoveryCode: randomUUID(), // recovery code not valid
    };
    const rejectResponse = await request(app.getHttpServer())
      .post(PATH_URL_NEW_PASS)
      .send(newPassword);

    expect(rejectResponse.status).toBe(HttpStatus.BAD_REQUEST);

    expect(rejectResponse.body).toEqual<ApiErrorResultType>({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });

    const userAfterUpdatePass = await userRepository.findById(registeredUserId);

    expect(userAfterUpdatePass?.password).toBe(userBeforeUpdatePass?.password);
  });

  //::TODO как можно для этого теста замокать конфиг
  it('should be 400 if has incorrect value ( RecoveryCode is  expired)', async () => {
    const userBeforeUpdatePass =
      await userRepository.findById(registeredUserId);
    confirmationConfig.emailExpiresInHours = -1;

    await request(app.getHttpServer())
      .post(PATH_URL_RECOVERY_PASS)
      .send({ email: infoRegisteredUser.email });

    const recoveryPasswordByUser =
      await passRecoveryRepository.findByUserId(registeredUserId);

    const codeExpiredResponse = await request(app.getHttpServer())
      .post(PATH_URL_NEW_PASS)
      .send({
        newPassword: generateRandomStringForTest(passwordConstraints.minLength),
        recoveryCode: recoveryPasswordByUser?.code,
      });

    expect(codeExpiredResponse.status).toBe(HttpStatus.BAD_REQUEST);

    expect(codeExpiredResponse.body).toEqual<ApiErrorResultType>({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });

    const userAfterUpdatePass = await userRepository.findById(registeredUserId);

    expect(userAfterUpdatePass?.password).toBe(userBeforeUpdatePass?.password);
  });

  it('Should be return 429 if than 5 attempts from one IP-address during 10 seconds ', async () => {
    if (throttlerConfig.enabled) {
      for (let i = 0; i < 5; i++) {
        await request(app.getHttpServer())
          .post('/api/auth/new-password')
          .send({
            newPassword: 'newPassword123456',
            recoveryCode: `recoveryCode123456${i + 1}`,
          });
      }

      const resManyAttempts = await request(app.getHttpServer())
        .post('/api/auth/new-password')
        .send({
          newPassword: 'newPassword123456',
          recoveryCode: 'recoveryCode123456',
        });

      expect(resManyAttempts.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    } else {
      console.info('ThrottlerConfig off');
    }
  });
});
