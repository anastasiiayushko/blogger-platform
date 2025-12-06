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
import { randomUUID } from 'crypto';
import { PublishInputDto } from '../../../src/modules/quiz/sa-question/api/input-dto/publish.input-dto';

describe('SaQuiz - published question (e2e)', () => {
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
  it('Should not be toggle published a question if Unauthorized', async () => {
    const badReq = await saQuizQuestionApiManager.togglePublish(
      storeQuestion.id,
      { published: true } as PublishInputDto,
      getAuthHeaderBasicTest('bla:bla'),
    );

    expect(badReq.statusCode).toBe(HttpStatus.UNAUTHORIZED);

    const question = await questionQueryRepository.findOrNotFoundFail(
      storeQuestion.id,
    );
    expect(storeQuestion).toEqual(question);
  });
  it('Should not be toggle published a question if invalid input model has incorrect values', async () => {
    const badReq =
      await saQuizQuestionApiManager.togglePublish<ApiErrorResultType>(
        storeQuestion.id,
        {} as PublishInputDto,
      );

    assertApiError(badReq.body, badReq.status, {
      statusCode: HttpStatus.BAD_REQUEST,
      firstFieldName: 'published',
    });

    const question = await questionQueryRepository.findOrNotFoundFail(
      storeQuestion.id,
    );
    expect(storeQuestion).toEqual(question);
  });

  it('Should not be update a question if not exist', async () => {
    const resUpd = await saQuizQuestionApiManager.togglePublish(randomUUID(), {
      published: true,
    } as PublishInputDto);
    expect(resUpd.status).toBe(HttpStatus.NOT_FOUND);
  });

  it('Should be switch published a question', async () => {
    const resUpd = await saQuizQuestionApiManager.togglePublish(
      storeQuestion.id,
      { published: true } as PublishInputDto,
    );
    expect(resUpd.status).toBe(HttpStatus.NO_CONTENT);

    const updatedQuestion = await questionQueryRepository.findOrNotFoundFail(
      storeQuestion.id,
    );

    assertQuestionView(updatedQuestion, {
      body: storeQuestion.body,
      published: true,
      correctAnswers: storeQuestion.correctAnswers,
    });
  });
});
