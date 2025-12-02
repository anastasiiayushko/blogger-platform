import { INestApplication } from '@nestjs/common';
import {
  CreateQuestionCommand,
  CreateQuestionHandler,
} from '../../../src/modules/quiz/questions/application/usecases/create-question.usecase';
import { QuestionQueryRepository } from '../../../src/modules/quiz/questions/infrastructure/question.query-repository';
import { CoreModule } from '../../../src/core/core.module';
import { configModule } from '../../../src/dynamic-config-module';
import { QuizGameModule } from '../../../src/modules/quiz/quiz-game.module';
import { DatabaseModule } from '../../../src/core/database/database.module';
import { setupTestApp } from '../../helpers/setup-test-app';
import { DataSource } from 'typeorm';
import { ormClearDatabase } from '../../util/orm-db-cleaner';
import { questionBodyConstraints } from '../../../src/modules/quiz/questions/domain/question.constrains';
import { generateRandomStringForTest } from '../../helpers/common-helpers';
import {
  GetQuestionsWithPagingHandler,
  GetQuestionsWithPagingQuery,
} from '../../../src/modules/quiz/questions/application/query-usecases/get-questions-with-paging.query-usecase';
import { QuestionQueryParams } from '../../../src/modules/quiz/questions/api/input-dto/question-query-params.input-dto';

describe('SA Quiz - CreateQuestion (integration)', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let dataSource: DataSource;
  let createQuestionHandler: CreateQuestionHandler;
  let qetQuestionsWithPagingHandler: GetQuestionsWithPagingHandler;
  let questionQueryRepository: QuestionQueryRepository;

  beforeAll(async () => {
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [
        CoreModule,
        configModule, //  инициализация конфигурации
        DatabaseModule,
        QuizGameModule,
      ],
    });
    app = appNest;
    dataSource = dS;
    createQuestionHandler = app.get(CreateQuestionHandler);
    qetQuestionsWithPagingHandler = app.get(GetQuestionsWithPagingHandler);
    questionQueryRepository = app.get(QuestionQueryRepository);
    await ormClearDatabase(dataSource);
  });
  afterEach(async () => {
    await ormClearDatabase(dataSource);
  });

  it('should be created new question. Check question to View', async () => {
    const payload = {
      body: 'How many continents are on Earth?',
      answers: ['Seven', '7', '  seven '],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );

    expect(questionId).toEqual(expect.any(String));
    const storedQuestion =
      await questionQueryRepository.findOrNotFoundFail(questionId);

    expect(storedQuestion.body).toBe(payload.body);
    expect(storedQuestion.correctAnswers).toEqual(['seven', '7']);
    expect(storedQuestion.published).toBe(false);
    expect(typeof storedQuestion.createdAt).toBe('string');
    expect(typeof storedQuestion.updatedAt).toBe('string');
  });

  it('Checking for incorrect input values in DTO', async () => {
    const errorBody = await createQuestionHandler
      .execute(new CreateQuestionCommand('', ['bla']))
      .catch((e) => e);
    expect(errorBody[0].property).toBe('body');

    const errorBodyMin = await createQuestionHandler
      .execute(
        new CreateQuestionCommand(
          generateRandomStringForTest(questionBodyConstraints.minLength - 1),
          ['bla'],
        ),
      )
      .catch((e) => e);
    expect(errorBodyMin[0].property).toBe('body');

    const errorBodyMax = await createQuestionHandler
      .execute(
        new CreateQuestionCommand(
          generateRandomStringForTest(questionBodyConstraints.maxLength + 1),
          ['bla'],
        ),
      )
      .catch((e) => e);
    expect(errorBodyMax[0].property).toBe('body');

    const errorAnswersEmpty = await createQuestionHandler
      .execute(new CreateQuestionCommand('stringsttring', []))
      .catch((e) => e);

    expect(errorAnswersEmpty[0].property).toBe('correctAnswers');

    const errorAnswersInvalid = await createQuestionHandler
      .execute(new CreateQuestionCommand('stringsttring', [4 as unknown as string]))
      .catch((e) => e);

    expect(errorAnswersInvalid[0].property).toBe('correctAnswers');

    const queryParams = new QuestionQueryParams();

    const result = await qetQuestionsWithPagingHandler.execute(
      new GetQuestionsWithPagingQuery(queryParams),
    );
    expect(result.totalCount).toBe(0);
    expect(result.pageSize).toBe(10);
    expect(result.page).toBe(1);
    expect(result.items.length).toBe(0);
  });

  it('Check view dto', async () => {
    const payload = {
      body: ' Check view dto ',
      answers: ['Body', ' body ', 'answers ', '   aNswErs ', '7+7'],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );

    expect(questionId).toEqual(expect.any(String));
    const storedQuestion =
      await questionQueryRepository.findOrNotFoundFail(questionId);

    console.log(questionId);
    expect(storedQuestion.id).toEqual(expect.any(String));
    expect(storedQuestion.published).toBe(false);
    expect(storedQuestion.body).toBe(payload.body.trim());
    expect(storedQuestion.correctAnswers).toEqual(['body', 'answers', '7+7']);
    expect(storedQuestion.createdAt).toEqual(expect.any(String));
    expect(storedQuestion.updatedAt).toEqual(expect.any(String));
  });
});
