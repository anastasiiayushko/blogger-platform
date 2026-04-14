import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { ResponseBodySuperTest } from '../e2e/type/response-super-test';
import { GamePairViewDto } from '../../src/modules/quiz/quiz-game/infrastructure/query/mapper/game-pair.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';
import { AnswerInputDto } from '../../src/modules/quiz/quiz-game/features/pair-game/api/input-dto/answer.input-dto';
import { AnswerViewDto } from '../../src/modules/quiz/quiz-game/features/pair-game/api/view-dto/answer.view-dto';

export class PairQuizGameApiManager {
  private urlPath = '/api/pair-game-quiz';

  constructor(private app: INestApplication) {}

  async myCurrent(
    accessToken: string,
  ): Promise<ResponseBodySuperTest<GamePairViewDto>> {
    return request(this.app.getHttpServer())
      .get(this.urlPath + '/pairs/my-current')
      .set('Authorization', `Bearer ${accessToken}`);
  }

  async getAllGames(
    accessToken: string,
  ): Promise<ResponseBodySuperTest<PaginatedViewDto<GamePairViewDto[]>>> {
    return request(this.app.getHttpServer())
      .get(this.urlPath + '/pairs/my')
      .set('Authorization', `Bearer ${accessToken}`);
  }
  async getGameById(
    gameId: string,
    accessToken: string,
  ): Promise<ResponseBodySuperTest<GamePairViewDto>> {
    return request(this.app.getHttpServer())
      .get(this.urlPath + '/pairs/' + gameId)
      .set('Authorization', `Bearer ${accessToken}`);
  }
  async connection(
    accessToken: string,
  ): Promise<ResponseBodySuperTest<GamePairViewDto>> {
    return request(this.app.getHttpServer())
      .post(this.urlPath + '/pairs/connection')
      .set('Authorization', `Bearer ${accessToken}`);
  }
  async answer(
    answerInput: AnswerInputDto,
    accessToken: string,
  ): Promise<ResponseBodySuperTest<AnswerViewDto>> {
    return request(this.app.getHttpServer())
      .post(this.urlPath + '/pairs/my-current/answers')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(answerInput);
  }
}
