import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ResponseBodySuperTest } from '../e2e/type/response-super-test';

export class PairQuizGame {
  private urlPath = '/api/pair-game-quiz';

  constructor(private app: INestApplication) {}

  async myCurrent(accessToken: string): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .get('/pairs/my-current')
      .set('Authorization', `Bearer ${accessToken}`);
  }

  async my(accessToken: string): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .get('/pairs/my')
      .set('Authorization', `Bearer ${accessToken}`);
  }
}
