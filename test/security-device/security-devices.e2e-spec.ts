import {
  excludeCookiesFromHeaders,
  getAuthHeaderBasicTest,
  getCookieValueByName,
} from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { initSettings } from '../helpers/init-setting';
import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { DateUtil } from '../../src/core/utils/DateUtil';
import { SecurityDevicesApiManager } from '../helpers/api-manager/security-devices-api-manager';
import { ThrottlerConfig } from '../../src/core/config/throttler.config';
import { randomUUID } from 'crypto';
import { SessionDeviceRepository } from '../../src/modules/user-accounts/infrastructure/session-device.repository';

describe('Security devices', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userTestManger: UsersApiManagerHelper;
  let securityDevicesApiManager: SecurityDevicesApiManager;
  let sessionDeviceRepository: SessionDeviceRepository;
  let refreshTokenContext: JwtService;

  const userCredentials = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings((moduleBuilder) =>
      moduleBuilder.overrideProvider(ThrottlerConfig).useFactory({
        factory: (cfg: ThrottlerConfig) => ({
          ...cfg,
          enabled: false,
        }),
      }),
    );
    app = init.app;
    userTestManger = init.userTestManger;
    securityDevicesApiManager = new SecurityDevicesApiManager(app);
    sessionDeviceRepository = app.get<SessionDeviceRepository>(
      SessionDeviceRepository,
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

  it('Should be created session device after success login', async () => {
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

    const sessionDevice = await sessionDeviceRepository.findByDeviceId(
      decode.deviceId,
    );

    expect(sessionDevice!.user.id).toBe(decode.userId);
    expect(DateUtil.convertUnixToUTC(decode.iat)).toEqual(
      sessionDevice!.lastActiveAt,
    );
    expect(DateUtil.convertUnixToUTC(decode.exp)).toEqual(
      sessionDevice!.expirationAt,
    );
  });

  it('return all devices with active sessions for current user', async () => {
    const res = await userTestManger.login({
      loginOrEmail: userCredentials.login,
      password: userCredentials.password,
    });
    expect(res.status).toBe(HttpStatus.OK);
    const cookies = excludeCookiesFromHeaders(res.headers);

    const sessionDevicesResponse =
      await securityDevicesApiManager.getAllDeviceSessions(cookies);

    expect(sessionDevicesResponse.status).toBe(HttpStatus.OK);
    expect(sessionDevicesResponse.body.length).toBe(2);
  });

  it('should be 204 and  terminate all other (exclude current) device"s sessions', async () => {
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

    const terminateAllResponse =
      await securityDevicesApiManager.deleteAllOtherDeviceSessions(cookies);

    expect(terminateAllResponse.status).toBe(HttpStatus.NO_CONTENT);

    const allSessionDevice =
      await securityDevicesApiManager.getAllDeviceSessions(cookies);

    expect(allSessionDevice!.body.length).toBe(1);

    const currentSessionDevice = allSessionDevice!.body[0];

    expect(currentSessionDevice.deviceId).toEqual(decode.deviceId);
  });

  it('should be 204 and terminate current device session by deviceId', async () => {
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

    const terminateCurrentDeviceResponse =
      await securityDevicesApiManager.deleteDeviceSessionByDeviceId(
        decode.deviceId,
        cookies,
      );

    expect(terminateCurrentDeviceResponse.status).toBe(HttpStatus.NO_CONTENT);

    const currentSessionDevice = await sessionDeviceRepository.findByDeviceId(
      decode.deviceId,
    );
    expect(currentSessionDevice).toEqual(null);
  });

  it('should be 403 If try to delete the deviceId of other user', async () => {
    const userLoginRes = await userTestManger.login({
      loginOrEmail: userCredentials.login,
      password: userCredentials.password,
    });

    expect(userLoginRes.status).toBe(HttpStatus.OK);

    const userCookies = excludeCookiesFromHeaders(userLoginRes.headers);

    await userTestManger.createUser(
      {
        login: 'otherUser',
        email: 'otherUser@example.com',
        password: 'password123',
      },
      basicAuth,
    );

    const otherUserLoginRes = await userTestManger.login({
      loginOrEmail: 'otherUser',
      password: 'password123',
    });

    expect(otherUserLoginRes.status).toBe(HttpStatus.OK);

    const otherUserCookies = excludeCookiesFromHeaders(
      otherUserLoginRes.headers,
    );

    const otherUserRefreshToken = getCookieValueByName(
      otherUserCookies,
      'refreshToken',
    ) as string;

    const decodeOtherUser = refreshTokenContext.decode(
      otherUserRefreshToken,
    ) as {
      userId: string;
      deviceId: string;
      iat: number;
      exp: number;
    };

    const terminateCurrentDeviceResponse =
      await securityDevicesApiManager.deleteDeviceSessionByDeviceId(
        decodeOtherUser.deviceId,
        userCookies,
      );

    expect(terminateCurrentDeviceResponse.status).toBe(HttpStatus.FORBIDDEN);

    const currentSessionDevice = await sessionDeviceRepository.findByDeviceId(
      decodeOtherUser.deviceId,
    );
    expect(currentSessionDevice!.user.id).toEqual(decodeOtherUser.userId);
  });

  it('should be 404 If try to delete the deviceId not existing', async () => {
    const userLoginRes = await userTestManger.login({
      loginOrEmail: userCredentials.login,
      password: userCredentials.password,
    });

    expect(userLoginRes.status).toBe(HttpStatus.OK);

    const userCookies = excludeCookiesFromHeaders(userLoginRes.headers);

    const terminateCurrentDeviceResponse =
      await securityDevicesApiManager.deleteDeviceSessionByDeviceId(
        randomUUID(),
        userCookies,
      );

    expect(terminateCurrentDeviceResponse.status).toBe(HttpStatus.NOT_FOUND);
  });
});
