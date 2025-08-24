import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { CreateUsersInputDto } from '../../../src/modules/user-accounts/api/input-dto/create-users.input-dto';
import { ResponseBodySuperTest } from '../../type/response-super-test';

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

  async refreshToken(cookies: string[], userAgent = 'Chrome') {
    return await request(this.app.getHttpServer())
      .post(this.URL_PATH + '/refresh-token')
      .set('Cookie', cookies.join('; '))
      .set('User-Agent', userAgent);
  }

  async logout(cookies: string[], userAgent = 'Chrome') {
    return await request(this.app.getHttpServer())
      .post(this.URL_PATH + '/logout')
      .set('Cookie', cookies.join('; '))
      .set('User-Agent', userAgent);
  }
}
