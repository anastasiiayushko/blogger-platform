import {
  delay,
  excludeCookiesFromHeaders,
  findCookieByName,
  getAuthHeaderBasicTest,
  getCookieValueByName,
} from '../helpers/common-helpers';
import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { SecurityDevicesApiManager } from '../helpers/api-manager/security-devices-api-manager';
import { AuthApiManager } from '../helpers/api-manager/auth-api-manager';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../src/modules/user-accounts/constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { SecurityDeviceViewDto } from '../../src/modules/user-accounts/api/view-dto/security-device.view-dto';
import {
  decodeAndValidateRefreshToken,
  validateJwtTokenRegex,
  validateTokenCookie,
} from '../util/token-util';
import { UserViewDto } from '../../src/modules/user-accounts/infrastructure/mapper/user-view-dto';
import { DeviceViewModel } from '../../src/modules/user-accounts/infrastructure/view-model/device-view-model';

describe('Auth /refresh-token', () => {
  const basicAuth = getAuthHeaderBasicTest();
  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let securityDevicesApiManger: SecurityDevicesApiManager;
  let authApiManager: AuthApiManager;
  let refreshTokenContext: JwtService;

  const userNika = {
    login: 'nika',
    password: 'nika123456',
    email: 'nika@gmail.com',
  };

  beforeEach(async () => {
    const init = await initSettings();
    app = init.app;
    userApiManager = init.userTestManger;
    securityDevicesApiManger = new SecurityDevicesApiManager(app);
    authApiManager = new AuthApiManager(app);

    refreshTokenContext = app.get(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN);
  });

  afterEach(async () => {
    await app.close();
  });

  it('Should be return status code 200 and pair token assess and refresh set to cookies', async () => {
    //:TODo flow login
    const resCreated = await userApiManager.createUser(userNika, basicAuth);
    expect(resCreated.status).toBe(HttpStatus.CREATED);

    const resLoginUser = await userApiManager.login(
      {
        loginOrEmail: userNika.email,
        password: userNika.password,
      },
      'Chrome v100.0.4896.127',
    );
    expect(resLoginUser.status).toBe(HttpStatus.OK);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    validateJwtTokenRegex(resLoginUser.body.accessToken);

    const cookiesLogin = excludeCookiesFromHeaders(resLoginUser.headers);

    const refreshTokenValueLogin: string = getCookieValueByName(
      cookiesLogin,
      'refreshToken',
    ) as string;
    const cookieRefreshTokenLogin = findCookieByName(
      cookiesLogin,
      'refreshToken',
    ) as string;
    validateTokenCookie(cookieRefreshTokenLogin);
    validateJwtTokenRegex(refreshTokenValueLogin);

    const resGetDevices =
      await securityDevicesApiManger.getAllDeviceSessions(cookiesLogin);

    const deviceList = resGetDevices.body as DeviceViewModel[];
    expect(resGetDevices.status).toBe(HttpStatus.OK);
    expect(deviceList.length).toEqual(1);

    const currentDevice = deviceList[0];
    const user = resCreated.body as UserViewDto;
    // const decodeRefresh = await refreshTokenContext.decode(refreshToken);

    await decodeAndValidateRefreshToken(
      refreshTokenContext,
      refreshTokenValueLogin,
      user.id,
      currentDevice.deviceId,
      currentDevice.lastActiveDate,
    );

    const resRefresh = await authApiManager.refreshToken(cookiesLogin);
    expect(resRefresh.status).toBe(HttpStatus.OK);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const accessToken = resRefresh.body.accessToken as string;

    validateJwtTokenRegex(accessToken);

    const cookiesRefresh = excludeCookiesFromHeaders(resRefresh.headers);

    const cookiesRefreshToken = findCookieByName(
      cookiesRefresh,
      'refreshToken',
    ) as string;
    validateTokenCookie(cookiesRefreshToken);

    const refreshTokenValue = getCookieValueByName(
      cookiesRefresh,
      'refreshToken',
    ) as string;

    validateJwtTokenRegex(refreshTokenValue);

    const resGetDevicesAfterUpdate =
      await securityDevicesApiManger.getAllDeviceSessions(cookiesRefresh);

    const devicesList = resGetDevicesAfterUpdate.body as DeviceViewModel[];

    const deviceAfterUpdate: SecurityDeviceViewDto = devicesList[0];

    await decodeAndValidateRefreshToken(
      refreshTokenContext,
      refreshTokenValue,
      user.id,
      deviceAfterUpdate.deviceId,
      deviceAfterUpdate.lastActiveDate,
    );
  });

  // Логин с другого устройства добавляет новую запись в список сессий.
  it('Should be 401 if refreshToken invalid', async () => {
    await userApiManager.createUser(userNika, basicAuth);
    const resLogin = await userApiManager.login(
      {
        loginOrEmail: userNika.email,
        password: userNika.password,
      },
      'chrome',
    );
    expect(resLogin.status).toBe(HttpStatus.OK);
    await delay(1000);

    const cookiesLogin = excludeCookiesFromHeaders(resLogin.headers);

    await authApiManager.refreshToken(cookiesLogin);

    await delay(1000);

    const resRefreshExpireToken =
      await authApiManager.refreshToken(cookiesLogin);


    expect(resRefreshExpireToken.status).toBe(HttpStatus.UNAUTHORIZED);
  });
});
