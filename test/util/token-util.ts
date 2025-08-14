import { expect } from '@jest/globals';
import { JwtService } from '@nestjs/jwt';
import { DateUtil } from '../../src/core/utils/DateUtil';

export const jwtRegex = /^[A-Za-z0-9-_]+?\.[A-Za-z0-9-_]+?\.[A-Za-z0-9-_]+$/;

export function validateJwtTokenRegex(token: string) {
  expect(token).toMatch(jwtRegex); // Проверить формат токена JWT
}

export function validateTokenCookie(cookie: string) {
  expect(cookie).toContain('HttpOnly'); // Проверяем, что куки защищены
  expect(cookie).toContain('Secure'); // Проверяем безопасный трафик (HTTPS)
  expect(cookie).toContain('Path'); // Проверяем, установлен ли путь
}

export function findAndValidateTokenCookie(
  cookies: string[],
  cookieName: string,
) {
  const cookie = cookies.find((cookie) => cookie.startsWith(`${cookieName}=`));
  expect(cookie).toContain('HttpOnly'); // Проверяем, что куки защищены
  expect(cookie).toContain('Secure'); // Проверяем безопасный трафик (HTTPS)
  expect(cookie).toContain('Path'); // Проверяем, установлен ли путь
}

export async function decodeAndValidateRefreshToken(
  jwtService: JwtService,
  token: string,
  expectedUserId: string,
  expectedDeviceId: string,
  expectedDeviceLastActiveDate?: string,
) {
  const decodedToken: any = await jwtService.decode(token);
  expect(decodedToken.userId).toEqual(expectedUserId);
  expect(decodedToken.deviceId).toEqual(expectedDeviceId);

  if (expectedDeviceLastActiveDate) {
    expect(expectedDeviceLastActiveDate).toEqual(
      DateUtil.convertUnixToUTC(decodedToken.iat).toISOString(),
    ); // Проверяет, что `iat` обновился
  }
  return decodedToken;
}

export function validateLastActiveDate(lastActiveDate: string, iat: number) {
  expect(lastActiveDate).toEqual(DateUtil.convertUnixToUTC(iat).toISOString());
}
