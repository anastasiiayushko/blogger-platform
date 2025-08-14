import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';

describe('Auth /new-password', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersApiManagerHelper;
  let userRepository: UsersRepository;

  const credExistingUser = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };
  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UsersRepository>(UsersRepository);
    const userRes = await userTestManger.createUser(
      credExistingUser,
      basicAuth,
    );
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be return status 204 and success update password', async () => {
    const recovery = await request(app.getHttpServer())
      .post('/api/auth/password-recovery')
      .send({ email: credExistingUser.email });
    expect(recovery.status).toBe(HttpStatus.NO_CONTENT);

    const userResultBefore = await userRepository.findByEmailOrLogin(
      credExistingUser.email,
    );
    expect(userResultBefore!.recoveryPasswordConfirm.isConfirmed).toBeFalsy();

    const newPassword = {
      newPassword: 'newPassword123456',
      recoveryCode: userResultBefore!.recoveryPasswordConfirm!.recoveryCode,
    };
    const newPasswordResult = await request(app.getHttpServer())
      .post('/api/auth/new-password')
      .send(newPassword);

    expect(newPasswordResult.status).toBe(HttpStatus.NO_CONTENT);

    const userResultAfter = await userRepository.findByEmailOrLogin(
      credExistingUser.email,
    );
    expect(userResultAfter!.recoveryPasswordConfirm.isConfirmed).toBeTruthy();
  });

  it('should be 400 if recovery code used', async () => {
    const userResultBefore = await userRepository.findByEmailOrLogin(
      credExistingUser.email,
    );
    expect(userResultBefore!.recoveryPasswordConfirm.isConfirmed).toBeTruthy();

    const newPassword = {
      newPassword: 'newPassword123456',
      recoveryCode: userResultBefore!.recoveryPasswordConfirm!.recoveryCode,
    };
    const errRes = await request(app.getHttpServer())
      .post('/api/auth/new-password')
      .send(newPassword);

    expect(errRes.status).toBe(HttpStatus.BAD_REQUEST);
    expect(errRes.body).toEqual({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });
  });

  it('Should be return 429 if than 5 attempts from one IP-address during 10 seconds ', async () => {
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
  });
});
