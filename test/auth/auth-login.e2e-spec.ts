import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import {
  excludeCookiesFromHeaders,
  getAuthHeaderBasicTest,
} from '../helpers/common-helpers';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import {
  findAndValidateTokenCookie,
  validateJwtTokenRegex,
} from '../util/token-util';
import { ThrottlerConfig } from '../../src/core/config/throttler.config';

describe('Auth /login', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersApiManagerHelper;
  let throttlerConfig: ThrottlerConfig;

  const userCredentials = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    throttlerConfig = app.get<ThrottlerConfig>(ThrottlerConfig);
    const userRes = await userTestManger.createUser(userCredentials, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should be return status 200 and the sign in to system', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userCredentials.login,
      password: userCredentials.password,
    });
    expect(res.status).toBe(HttpStatus.OK);

    validateJwtTokenRegex(res.body.accessToken);

    const cookies = excludeCookiesFromHeaders(res.headers);

    findAndValidateTokenCookie(cookies, 'refreshToken');
  });

  it('Should be return status 401 if such login dont existing in system', async () => {
    const res = await userTestManger.login({
      loginOrEmail: 'mock',
      password: userCredentials.password,
    });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(Object.keys(res.body).length).toBe(0);
  });

  it('Should be return 401 if such email dont existing in system', async () => {
    const res = await userTestManger.login({
      loginOrEmail: 'mock@test.com',
      password: userCredentials.password,
    });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(Object.keys(res.body).length).toBe(0);
  });

  it('Should be return 401 if password incorrect', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userCredentials.email,
      password: 'mock124password',
    });
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(Object.keys(res.body).length).toBe(0);
  });

  it('Should be return 401 if sign in data not valid and dont set refreshToken in cookie', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userCredentials.email,
      password: 'mock124password',
    });
    const cookies = excludeCookiesFromHeaders(res.headers);
    expect(cookies).not.toContain('refreshToken');
    expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(Object.keys(res.body).length).toBe(0);
  });

  it('Should be return 429 if than 5 attempts from one IP-address during 10 seconds ', async () => {
    if (throttlerConfig.enabled) {
      for (let i = 0; i < 5; i++) {
        await userTestManger.login({
          loginOrEmail: userCredentials.email,
          password: userCredentials.password,
        });
      }

      const resManyAttempts = await userTestManger.login({
        loginOrEmail: userCredentials.email,
        password: userCredentials.password,
      });

      expect(resManyAttempts.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    } else {
      console.info('ThrottlerConfig off');
    }
  });
});
