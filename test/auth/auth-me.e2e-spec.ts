import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UsersTestManagerHelper } from '../helpers/users-test-manager-helper';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { UserMeViewDto } from '../../src/modules/user-accounts/api/view-dto/user-me.view-dto';
import { JwtService } from '@nestjs/jwt';
import * as process from 'node:process';

describe('Auth /me', () => {
  const ORIGINAL_ENV = process.env;
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersTestManagerHelper;
  let jwtService: JwtService;

  const userAuthData = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    jwtService = app.get<JwtService>(JwtService);
    const userRes = await userTestManger.createUser(userAuthData, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });
  afterAll(async () => {
    process.env.JWT_AT_EXPIRES = ORIGINAL_ENV.JWT_AT_EXPIRES;

    await app.close();
  });

  it('Should be return user be bearer token', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userAuthData.login,
      password: userAuthData.password,
    });
    const authToken = res.body.accessToken;
    expect(res.status).toBe(HttpStatus.OK);
    expect(authToken).toEqual(expect.any(String));

    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(HttpStatus.OK);

    expect(meRes.body).toEqual<UserMeViewDto>({
      login: userAuthData.login,
      email: userAuthData.email,
      userId: expect.any(String),
    });
  });

  it('Should be return 401 if jwt  expired', async () => {
    process.env.JWT_AT_EXPIRES = '-5s';
    const loginRes = await userTestManger.login({
      loginOrEmail: userAuthData.login,
      password: userAuthData.password,
    });
    expect(loginRes.status).toBe(HttpStatus.OK);
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
    expect(meRes.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(meRes.body).toEqual({});
  });
});
