import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { CreateUsersInputDto } from '../../../src/modules/user-accounts/api/input-dto/create-users.input-dto';
import { ResponseBodySuperTest } from '../../type/response-super-test';
import { UserViewDto } from '../../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { LoginInputDto } from '../../../src/modules/user-accounts/api/input-dto/login.input-dto';
import { AccessTokenViewDto } from '../../../src/modules/user-accounts/api/view-dto/access-token.view-dto';
import { delay } from '../common-helpers';

export class UsersApiManagerHelper {
  private URL_PATH_USERS = '/api/security-devices';
  private URL_SA_USERS = '/api/sa/users';

  constructor(private app: INestApplication) {}

  async createUser(
    userInputDTO: CreateUsersInputDto,
    basicAuth: string,
  ): ResponseBodySuperTest<UserViewDto> {
    return await request(this.app.getHttpServer())
      .post(this.URL_SA_USERS)
      .set('Authorization', basicAuth)
      .send(userInputDTO);
  }

  async deleteById(
    userId: string,
    basicAuth: string,
  ): ResponseBodySuperTest<void> {
    return await request(this.app.getHttpServer())
      .delete(`${this.URL_SA_USERS}/${userId}`)
      .set('Authorization', basicAuth);
  }

  async login(
    loginInputDTO: LoginInputDto,
    userAgent: string = 'Chrome',
  ): ResponseBodySuperTest<AccessTokenViewDto> {
    return request(this.app.getHttpServer())
      .post('/api/auth/login')
      .set('User-Agent', userAgent)
      .send(loginInputDTO);
  }

  async createSeveralUsers(
    userCount: number,
    basicAuth: string,
  ): Promise<UserViewDto[]> {
    // const userLength = Array.from({ length: userCount });
    const result: UserViewDto[] = [];

    for (let i = 0; i < userCount; i++) {
      await delay(60);
      const res = await this.createUser(
        {
          login: `test${i}`,
          email: `test${i}@email.com`,
          password: 'test123456',
        },
        basicAuth,
      );
      result.push(res.body);
    }

    return await Promise.all(result);
  }

  async createAndLoginSeveralUsers(
    userCount: number,
    basicAuth: string,
  ): Promise<AccessTokenViewDto[]> {
    const usersCreated = await this.createSeveralUsers(userCount, basicAuth);

    const usersLoginInSystem = usersCreated.map((user, index) => {
      return this.login({
        loginOrEmail: user.login,
        password: `test123456`,
      }).then((res) => res.body);
    });
    return await Promise.all(usersLoginInSystem);
  }

  async registrationUser(
    userInput: CreateUsersInputDto,
  ): ResponseBodySuperTest {
    return await request(this.app.getHttpServer())
      .post('/api/auth/registration')
      .send(userInput);
  }

  async refreshToken(cookies: string[]) {
    return await request(this.app.getHttpServer())
      .post(URL + '/refresh-token')
      .set('Cookie', cookies.join('; '));
  }
}
