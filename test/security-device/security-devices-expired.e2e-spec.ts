import {
  excludeCookiesFromHeaders,
  getAuthHeaderBasicTest,
  getCookieValueByName,
} from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { initSettings } from '../helpers/init-setting';
import { SessionDeviceSqlRepository } from '../../src/modules/user-accounts/infrastructure/sql/session-device.sql-repository';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { SecurityDevicesApiManager } from '../helpers/api-manager/security-devices-api-manager';
import { UserAccountConfig } from '../../src/modules/user-accounts/config/user-account.config';
import { delay } from '../helpers/delay-helper';

describe('Security devices refresh token expire (2s)', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersApiManagerHelper;
  let securityDevicesApiManager: SecurityDevicesApiManager;
  let sessionDeviceRepository: SessionDeviceSqlRepository;
  let refreshTokenContext: JwtService;

  const userCredentials = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings((moduleBuilder) =>
      moduleBuilder
        .overrideProvider(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
        .useFactory({
          factory: (cfg: UserAccountConfig) =>
            new JwtService({
              secret: cfg.refreshTokenSecret,
              signOptions: { expiresIn: '2s' },
            }),
          inject: [UserAccountConfig],
        }),
    );
    app = init.app;
    userTestManger = init.userTestManger;
    securityDevicesApiManager = new SecurityDevicesApiManager(app);
    sessionDeviceRepository = app.get<SessionDeviceSqlRepository>(
      SessionDeviceSqlRepository,
    );
    refreshTokenContext = app.get<JwtService>(
      REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
    );

    const userRes = await userTestManger.createUser(userCredentials, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });
  afterAll(async () => {
    await app.close();
  });

  it('should be 401 for point get all devices', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userCredentials.login,
      password: userCredentials.password,
    });

    expect(res.status).toBe(HttpStatus.OK);

    await delay(3000);

    const cookies = excludeCookiesFromHeaders(res.headers);
    const sessionDevicesResponse =
      await securityDevicesApiManager.getAllDeviceSessions(cookies);

    expect(sessionDevicesResponse.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(sessionDevicesResponse.body).toEqual({});
  });

  it('should be 401 for terminate deviceId session', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userCredentials.login,
      password: userCredentials.password,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const cookies = excludeCookiesFromHeaders(res.headers);
    const refreshToken = getCookieValueByName(
      cookies,
      'refreshToken',
    ) as string;

    const decode = refreshTokenContext.decode(refreshToken) as {
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    };
    await delay(3000);

    const sessionDevicesResponse =
      await securityDevicesApiManager.deleteDeviceSessionByDeviceId(
        decode.deviceId,
        cookies,
      );

    expect(sessionDevicesResponse.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(sessionDevicesResponse.body).toEqual({});
  });

  it('should be 401 of session that will be terminated', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userCredentials.login,
      password: userCredentials.password,
    });

    expect(res.status).toBe(HttpStatus.OK);

    const cookies = excludeCookiesFromHeaders(res.headers);

    await delay(3000);

    const sessionDevicesResponse =
      await securityDevicesApiManager.deleteAllOtherDeviceSessions(cookies);

    expect(sessionDevicesResponse.status).toBe(HttpStatus.UNAUTHORIZED);
    expect(sessionDevicesResponse.body).toEqual({});
  });
});
