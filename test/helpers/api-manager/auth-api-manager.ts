import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { CreateUsersInputDto } from '../../../src/modules/user-accounts/api/input-dto/create-users.input-dto';
import { ResponseBodySuperTest } from '../../e2e/type/response-super-test';
import { LoginInputDto } from '../../../src/modules/user-accounts/api/input-dto/login.input-dto';
import { AccessTokenViewDto } from '../../../src/modules/user-accounts/api/view-dto/access-token.view-dto';
import { UserMeViewDto } from '../../../src/modules/user-accounts/infrastructure/mapper/user-me-view-dto';

export class AuthApiManager {
  private URL_PATH = '/api/auth';

  constructor(private app: INestApplication) {}

  async registrationUser(
    userInput: CreateUsersInputDto,
  ): ResponseBodySuperTest {
    return await request(this.app.getHttpServer())
      .post(`${this.URL_PATH}/registration`)
      .send(userInput);
  }

  async refreshToken(
    cookies: string[],
    userAgent = 'Chrome',
  ): ResponseBodySuperTest<AccessTokenViewDto> {
    return await request(this.app.getHttpServer())
      .post(this.URL_PATH + '/refresh-token')
      .set('Cookie', cookies.join('; '))
      .set('User_root-Agent', userAgent);
  }

  async logout(
    cookies: string[],
    userAgent = 'Chrome',
  ): ResponseBodySuperTest<null> {
    return await request(this.app.getHttpServer())
      .post(this.URL_PATH + '/logout')
      .set('Cookie', cookies.join('; '))
      .set('User_root-Agent', userAgent);
  }

  async login(
    loginInput: LoginInputDto,
    userAgent = 'Chrome',
  ): ResponseBodySuperTest<AccessTokenViewDto> {
    return await request(this.app.getHttpServer())
      .post(this.URL_PATH + '/logout')
      .set('User_root-Agent', userAgent)
      .send({
        loginOrEmail: loginInput.loginOrEmail,
        password: loginInput.password,
      });
  }

  async me(accessToken: string): ResponseBodySuperTest<UserMeViewDto> {
    return await request(this.app.getHttpServer())
      .get(this.URL_PATH + '/me')
      .set('Authorization', `Bearer ${accessToken}`);
  }
}
