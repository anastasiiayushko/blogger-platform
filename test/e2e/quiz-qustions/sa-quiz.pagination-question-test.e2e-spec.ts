import { INestApplication } from '@nestjs/common';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { SaQuizQuestionApiManager } from '../../api-manager/sa-quiz-question-api-manager';
import { deleteAllDataApi } from '../../api-manager/delete-all-data-api';
import { QuestionQueryRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.query-repository';
import { FillQuestionsSeed } from '../../../seeds/fill-questions.seed';
import { DataSource } from 'typeorm';
import { SortDirection } from '../../../src/core/dto/base.query-params.input-dto';
import {
  QuestionPublishStatusEnum,
  QuestionSortByEnum,
} from '../../../src/modules/quiz/sa-question/api/input-dto/question-query-params.input-dto';

describe('SaQuiz - get question (e2e)', () => {
  let app: INestApplication;
  let saQuizQuestionApiManager: SaQuizQuestionApiManager;
  let questionQueryRepository: QuestionQueryRepository;

  beforeAll(async () => {
    const { app: appN, userTestManger } = await setupNextAppHttp();

    app = appN;
    questionQueryRepository = app.get(QuestionQueryRepository);
    saQuizQuestionApiManager = new SaQuizQuestionApiManager(app);
    const dataSource = app.get(DataSource);
    await deleteAllDataApi(app);
    await FillQuestionsSeed.up(dataSource);
  });
  afterAll(async () => {
    await app.close();
  });
  it('Should return question view with def filter', async () => {
    // await saQuizQuestionApiManager.getAllWithPaging();
    const res = await saQuizQuestionApiManager.getAllWithPaging({
      sortDirection: SortDirection.Asc,
      sortBy:  QuestionSortByEnum.body,
      publishedStatus: QuestionPublishStatusEnum.published,
    });
    console.log('res', res.body);
  });
});
