import { INestApplication } from '@nestjs/common';
import request from 'supertest';

import { CreateUsersInputDto } from '../../src/modules/user-accounts/api/input-dto/create-users.input-dto';
import { ResponseBodySuperTest } from '../e2e/type/response-super-test';
import { LoginInputDto } from '../../src/modules/user-accounts/api/input-dto/login.input-dto';
import { AccessTokenViewDto } from '../../src/modules/user-accounts/api/view-dto/access-token.view-dto';
import { UserMeViewDto } from '../../src/modules/user-accounts/infrastructure/mapper/user-me-view-dto';
import { QuestionInputDto } from '../../src/modules/quiz/sa-question/api/input-dto/question.input-dto';
import { getAuthHeaderBasicTest } from '../helpers/auth/basic-auth.helper';
import { QuestionQueryParams } from '../../src/modules/quiz/sa-question/api/input-dto/question-query-params.input-dto';
import { PublishInputDto } from '../../src/modules/quiz/sa-question/api/input-dto/publish.input-dto';
import { QuestionViewDto } from '../../src/modules/quiz/sa-question/api/input-dto/question.view-dto';
import { PaginatedViewDto } from '../../src/core/dto/base.paginated.view-dto';

export class SaQuizQuestionApiManager {
  private URL_PATH = '/api/sa/quiz/questions';
  private basicAuth = getAuthHeaderBasicTest();

  constructor(private app: INestApplication) {}

  async create<T = QuestionViewDto>(
    inputDto: QuestionInputDto,
    basicAuth = this.basicAuth,
  ): ResponseBodySuperTest<T> {
    return await request(this.app.getHttpServer())
      .post(`${this.URL_PATH}`)
      .send(inputDto)
      .set('Authorization', basicAuth);
  }

  async update<T = null>(
    questionId: string,
    inputDto: QuestionInputDto,
    basicAuth = this.basicAuth,
  ): ResponseBodySuperTest<T> {
    return await request(this.app.getHttpServer())
      .put(`${this.URL_PATH}/${questionId}`)
      .send(inputDto)
      .set('Authorization', basicAuth);
  }

  async delete<T = null>(
    questionId: string,
    basicAuth = this.basicAuth,
  ): ResponseBodySuperTest<T> {
    return await request(this.app.getHttpServer())
      .delete(`${this.URL_PATH}/${questionId}`)
      .set('Authorization', basicAuth);
  }

  async togglePublish<T=null>(
    questionId: string,
    inputDto: PublishInputDto,
    basicAuth = this.basicAuth,
  ): ResponseBodySuperTest<T> {
    return await request(this.app.getHttpServer())
      .put(`${this.URL_PATH}/${questionId}/publish`)
      .send(inputDto)
      .set('Authorization', basicAuth);
  }

  async getAllWithPaging(
    queryParams?: Partial<QuestionQueryParams>,
    basicAuth = this.basicAuth,
  ): ResponseBodySuperTest<PaginatedViewDto<QuestionViewDto[]>> {
    return await request(this.app.getHttpServer())
      .get(`${this.URL_PATH}`)
      .query(queryParams ?? {})
      .set('Authorization', basicAuth);
  }
}
