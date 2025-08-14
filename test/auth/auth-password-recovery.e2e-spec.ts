import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';

describe('Auth /password-recovery', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersApiManagerHelper;
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

  it('Should be return 204', async () => {
    const recovery = await request(app.getHttpServer())
      .post('/api/auth/password-recovery')
      .send({ email: existingUser.email });
    expect(recovery.status).toBe(HttpStatus.NO_CONTENT);
    expect(recovery.body).toEqual({});
  });

  it('Should be return 400 if email invalid', async () => {
    const recovery = await request(app.getHttpServer())
      .post('/api/auth/password-recovery')
      .send({ email: `test345@test.com` });
    expect(recovery.status).toBe(HttpStatus.BAD_REQUEST);
    expect(recovery.body).toEqual({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });
  });
});
