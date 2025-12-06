import { HttpStatus, INestApplication } from '@nestjs/common';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { SaQuizQuestionApiManager } from '../../api-manager/sa-quiz-question-api-manager';
import { QuestionInputDto } from '../../../src/modules/quiz/sa-question/api/input-dto/question.input-dto';
import { assertQuestionView } from '../../util/assert-view/assert-question-view';
import { deleteAllDataApi } from '../../api-manager/delete-all-data-api';
import { QuestionQueryRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.query-repository';
import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { ApiErrorResultType } from '../type/response-super-test';
import { QuestionViewDto } from '../../../src/modules/quiz/sa-question/api/input-dto/question.view-dto';
import { randomUUID } from 'crypto';

describe('SaQuiz - delete question (e2e)', () => {
  let app: INestApplication;
  let saQuizQuestionApiManager: SaQuizQuestionApiManager;
  let questionQueryRepository: QuestionQueryRepository;

  let storeQuestion: QuestionViewDto;
  beforeAll(async () => {
    const { app: appN, userTestManger } = await setupNextAppHttp();

    app = appN;
    questionQueryRepository = app.get(QuestionQueryRepository);
    saQuizQuestionApiManager = new SaQuizQuestionApiManager(app);
    await deleteAllDataApi(app);

    const inputDto = {
      body: 'How are you?',
      correctAnswers: ['fine', 'FINE', 'ok', 'OK'],
    };
    const resCreat = await saQuizQuestionApiManager.create(
      inputDto as QuestionInputDto,
    );
    expect(resCreat.status).toBe(HttpStatus.CREATED);
    assertQuestionView(resCreat.body, {
      body: inputDto.body,
      published: false,
      correctAnswers: ['fine', 'ok'],
    });
    storeQuestion = resCreat.body;
  });
  afterAll(async () => {
    await app.close();
  });
  it('Should not be delete a question if Unauthorized', async () => {
    const badReq = await saQuizQuestionApiManager.delete(
      storeQuestion.id,
      getAuthHeaderBasicTest('bla:bla'),
    );

    expect(badReq.statusCode).toBe(HttpStatus.UNAUTHORIZED);

    const question = await questionQueryRepository.findOrNotFoundFail(
      storeQuestion.id,
    );
    expect(storeQuestion).toEqual(question);
  });
  it('Should not be delete a question if not exist', async () => {
    const badReq =
      await saQuizQuestionApiManager.delete<ApiErrorResultType>(randomUUID());

    expect(badReq.statusCode).toBe(HttpStatus.NOT_FOUND);
  });
  it('Should be delete a question', async () => {
    const resCreat = await saQuizQuestionApiManager.delete(storeQuestion.id);
    expect(resCreat.status).toBe(HttpStatus.NO_CONTENT);

    const question = await questionQueryRepository.findById(storeQuestion.id);
    expect(question).toBe(null);
  });
});
