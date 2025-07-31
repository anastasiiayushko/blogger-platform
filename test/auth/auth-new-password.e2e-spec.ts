import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';

describe('Auth /new-password', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersTestManagerHelper;
  let userRepository: UsersRepository;

  const existingUser = {
    email: 'test@test.com',
    login: 'test',
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

  it('should be changed password', async () => {
    const recovery = await request(app.getHttpServer())
      .post('/api/auth/password-recovery')
      .send({ email: existingUser.email });
    expect(recovery.status).toBe(HttpStatus.NO_CONTENT);

    const userResultBefore = await userRepository.findByEmailOrLogin(
      existingUser.email,
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
      existingUser.email,
    );
    expect(userResultAfter!.recoveryPasswordConfirm.isConfirmed).toBeTruthy();
  });

  it('should be 400 if recovery confirmed', async () => {
    const userResultBefore = await userRepository.findByEmailOrLogin(
      existingUser.email,
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

});