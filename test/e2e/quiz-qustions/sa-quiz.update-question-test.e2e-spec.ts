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
import { QuestionViewDto } from '../../../src/modules/quiz/sa-question/api/input-dto/question.view-dto';
import { generateRandomStringForTest } from '../../util/random/generate-random-text';
import { questionBodyConstraints } from '../../../src/modules/quiz/sa-question/domain/question.constrains';
import { randomUUID } from 'crypto';

describe('SaQuiz - update question (e2e)', () => {
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
  it('Should not be update a question if Unauthorized', async () => {
    const inputDto = {
      body: 'How are you? this body is update',
      correctAnswers: ['fine', 'FINE'],
    };
    const badReq = await saQuizQuestionApiManager.update(
      storeQuestion.id,
      inputDto as QuestionInputDto,
      getAuthHeaderBasicTest('bla:bla'),
    );

    expect(badReq.statusCode).toBe(HttpStatus.UNAUTHORIZED);

    const question = await questionQueryRepository.findOrNotFoundFail(
      storeQuestion.id,
    );
    expect(storeQuestion).toEqual(question);
  });
  it('Should not be update a question if invalid input model has incorrect values', async () => {
    const inputDto = {
      body: generateRandomStringForTest(questionBodyConstraints.minLength - 1),
      correctAnswers: ['fine', 'FINE'],
    };
    const badReq = await saQuizQuestionApiManager.update<ApiErrorResultType>(
      storeQuestion.id,
      inputDto as QuestionInputDto,
    );

    assertApiError(badReq.body, badReq.status, {
      statusCode: HttpStatus.BAD_REQUEST,
      firstFieldName: 'body',
    });

    const question = await questionQueryRepository.findOrNotFoundFail(
      storeQuestion.id,
    );
    expect(storeQuestion).toEqual(question);
  });

  it('Should not be update a question if not exist', async () => {
    const inputDto = {
      body: 'How are you? YoY',
      correctAnswers: ['fine', 'FINE', 'fInE', 'so'],
    };
    const resUpd = await saQuizQuestionApiManager.update(
      randomUUID(),
      inputDto as QuestionInputDto,
    );
    expect(resUpd.status).toBe(HttpStatus.NOT_FOUND);

    const question = await questionQueryRepository.findById(storeQuestion.id);

    expect(question).toEqual(null);
  });

  it('Should be update a question', async () => {
    const inputDto = {
      body: 'How are you? YoY',
      correctAnswers: ['fine', 'FINE', 'fInE', 'so'],
    };
    const resUpd = await saQuizQuestionApiManager.update(
      storeQuestion.id,
      inputDto as QuestionInputDto,
    );
    expect(resUpd.status).toBe(HttpStatus.NO_CONTENT);

    const updatedQuestion = await questionQueryRepository.findOrNotFoundFail(
      storeQuestion.id,
    );

    assertQuestionView(updatedQuestion, {
      body: inputDto.body,
      published: false,
      correctAnswers: ['fine', 'so'],
    });
  });
});
