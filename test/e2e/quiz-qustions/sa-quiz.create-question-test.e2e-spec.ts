import { HttpStatus, INestApplication } from '@nestjs/common';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { SaQuizQuestionApiManager } from '../../api-manager/sa-quiz-question-api-manager';
import { QuestionInputDto } from '../../../src/modules/quiz/sa-question/api/input-dto/question.input-dto';
import { assertQuestionView } from '../../util/assert-view/assert-question-view';
import { deleteAllDataApi } from '../../api-manager/delete-all-data-api';
import { QuestionQueryRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.query-repository';
import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { assertApiError } from '../../util/assert-error/assert-api-error';
import { ApiErrorResultType } from '../type/response-super-test';

describe('SaQuiz - create question (e2e)', () => {
  let app: INestApplication;
  let saQuizQuestionApiManager: SaQuizQuestionApiManager;
  let questionQueryRepository: QuestionQueryRepository;

  beforeAll(async () => {
    const { app: appN, userTestManger } = await setupNextAppHttp();

    app = appN;
    questionQueryRepository = app.get(QuestionQueryRepository);
    saQuizQuestionApiManager = new SaQuizQuestionApiManager(app);
    await deleteAllDataApi(app);
  });
  afterAll(async () => {
    await app.close();
  });
  it('Should not be create a question if Unauthorized', async () => {
    const inputDto = {
      body: 'How are you?',
      correctAnswers: ['fine', 'FINE'],
    };
    const badReq = await saQuizQuestionApiManager.create<null>(
      inputDto as QuestionInputDto,
      getAuthHeaderBasicTest('bla:bla'),
    );

    expect(badReq.statusCode).toBe(HttpStatus.UNAUTHORIZED);

    const allQuestions = await saQuizQuestionApiManager.getAllWithPaging({});
    expect(allQuestions.status).toBe(HttpStatus.OK);
    expect(allQuestions.body.items.length).toBe(0);
  });
  it('Should not be create a question if invalid input model has incorrect values', async () => {
    const inputDto = {
      body: 'How are you?',
      correctAnswers: ['fine', 'FINE', 9],
    };
    const badReq = await saQuizQuestionApiManager.create<ApiErrorResultType>(
      inputDto as QuestionInputDto,
    );

    assertApiError(badReq.body, badReq.status, {
      statusCode: HttpStatus.BAD_REQUEST,
      firstFieldName: 'correctAnswers',
    });

    const allQuestions = await saQuizQuestionApiManager.getAllWithPaging({});
    expect(allQuestions.status).toBe(HttpStatus.OK);
    expect(allQuestions.body.items.length).toBe(0);
  });
  it('Should be create a question', async () => {
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
  });
});
