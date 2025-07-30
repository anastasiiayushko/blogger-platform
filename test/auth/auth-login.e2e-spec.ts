import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';

describe('Auth /login', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersTestManagerHelper;

  const userAuthData = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    const userRes = await userTestManger.createUser(userAuthData, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should be return 200 in correct login and password', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userAuthData.login,
      password: userAuthData.password,
    });
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('Should be return 200 in correct email and password', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userAuthData.email,
      password: userAuthData.password,
    });
    expect(res.status).toBe(HttpStatus.OK);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });
  it('Should be return 401 if login dont existing in system', async () => {
    const res = await userTestManger.login({
      loginOrEmail: 'mock',
      password: userAuthData.password,
    });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(Object.keys(res.body).length).toBe(0);
  });
  it('Should be return 401 if email dont existing in system', async () => {
    const res = await userTestManger.login({
      loginOrEmail: 'mock@test.com',
      password: userAuthData.password,
    });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(Object.keys(res.body).length).toBe(0);
  });
  it('Should be return 401 if password incorrect', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userAuthData.email,
      password: 'mock124password',
    });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(Object.keys(res.body).length).toBe(0);
  });
});
