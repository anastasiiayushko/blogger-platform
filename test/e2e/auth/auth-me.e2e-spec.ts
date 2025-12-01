import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../../helpers/common-helpers';
import request from 'supertest';
import { UsersApiManagerHelper } from '../../helpers/api-manager/users-api-manager-helper';
import { AccessTokenViewDto } from '../../../src/modules/user-accounts/api/view-dto/access-token.view-dto';
import { JwtService } from '@nestjs/jwt';
import { AuthApiManager } from '../../helpers/api-manager/auth-api-manager';
import { UserMeViewDto } from '../../../src/modules/user-accounts/infrastructure/mapper/user-me-view-dto';

describe('Auth me ', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let authApiManager: AuthApiManager;
  let userTestManger: UsersApiManagerHelper;
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
    authApiManager = new AuthApiManager(app);
    jwtService = app.get<JwtService>(JwtService);
    const userRes = await userTestManger.createUser(userAuthData, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });
  afterAll(async () => {
    // process.env.JWT_AT_EXPIRES = ORIGINAL_ENV.JWT_AT_EXPIRES;

    await app.close();
  });

  it('Should be return user be bearer token', async () => {
    const loginResponse = await userTestManger.login({
      loginOrEmail: userAuthData.login,
      password: userAuthData.password,
    });
    const { accessToken } = loginResponse.body as AccessTokenViewDto;
    expect(loginResponse.status).toBe(HttpStatus.OK);
    expect(accessToken).toEqual(expect.any(String));

    const meRes = await authApiManager.me(accessToken);
    expect(meRes.status).toBe(HttpStatus.OK);

    expect(meRes.body).toEqual<UserMeViewDto>({
      login: userAuthData.login,
      email: userAuthData.email,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      userId: expect.any(String),
    });
  });

  it('Should be return 401 if access token expiredAt', async () => {
    const loginRes = await userTestManger.login({
      loginOrEmail: userAuthData.login,
      password: userAuthData.password,
    });
    expect(loginRes.status).toBe(HttpStatus.OK);
    const { accessToken } = loginRes.body as AccessTokenViewDto;
    const decode = jwtService.decode<{
      userId: string;
      iat: number;
      exp: number;
    }>(accessToken);
    const expired = jwtService.sign(
      { userId: decode.userId },
      { secret: process.env.ACCESS_TOKEN_SECRET!, expiresIn: '-30s' },
    );
    const meRes = await request(app.getHttpServer())
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expired}`);

    expect(meRes.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(meRes.body).toEqual({});
  });
});
