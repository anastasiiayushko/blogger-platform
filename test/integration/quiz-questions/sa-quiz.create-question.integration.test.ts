import { INestApplication } from '@nestjs/common';
import {
  CreateQuestionCommand,
  CreateQuestionHandler,
} from '../../../src/modules/quiz/sa-question/application/usecases/create-question.usecase';
import { QuestionQueryRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.query-repository';
import { CoreModule } from '../../../src/core/core.module';
import { configModule } from '../../../src/dynamic-config-module';
import { DatabaseModule } from '../../../src/core/database/database.module';
import { setupTestApp } from '../../setup-app/setup-test-app';
import { DataSource } from 'typeorm';
import { ormDBCleaner } from '../../util/orm-db-cleaner';
import { questionBodyConstraints } from '../../../src/modules/quiz/sa-question/domain/question.constrains';
import { generateRandomStringForTest } from '../../util/random/generate-random-text';
import {
  GetQuestionsWithPagingHandler,
  GetQuestionsWithPagingQuery,
} from '../../../src/modules/quiz/sa-question/application/query-usecases/get-questions-with-paging.query-usecase';
import { QuestionQueryParams } from '../../../src/modules/quiz/sa-question/api/input-dto/question-query-params.input-dto';
import { assertQuestionView } from '../../util/assert-view/assert-question-view';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import { QuestionRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.repository';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../src/core/exceptions/domain-exception-codes';
import { assertValidateErrorDto } from '../../util/assert-error/assert-validate-error-dto';

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
        TypeOrmModule.forFeature([Question]),
      ],
      providers: [
        QuestionRepository,
        CreateQuestionHandler,
        GetQuestionsWithPagingHandler,
        QuestionQueryRepository,
      ],
    });
    app = appNest;
    dataSource = dS;
    createQuestionHandler = app.get(CreateQuestionHandler);
    qetQuestionsWithPagingHandler = app.get(GetQuestionsWithPagingHandler);
    questionQueryRepository = app.get(QuestionQueryRepository);
    await ormDBCleaner(dataSource);
  });
  // afterEach(async () => {
  //   //   if (dataSource.isInitialized) await ormClearDatabase(dataSource);
  //   // });
  afterAll(async () => {
    await app.close();
    await ormDBCleaner(dataSource);
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

    assertQuestionView(storedQuestion, {
      published: false,
      body: payload.body,
      correctAnswers: ['seven', '7'],
    });
  });

  it('validate input command', async () => {
    const passedBody = [
      ' ',
      '',
      generateRandomStringForTest(questionBodyConstraints.minLength - 1),
      generateRandomStringForTest(questionBodyConstraints.maxLength + 1),
    ];
    const reqInvalidBodyPay = passedBody.map((body) => {
      return createQuestionHandler.execute(
        new CreateQuestionCommand(body, ['bla']),
      );
    });

    const results = await Promise.allSettled(reqInvalidBodyPay);

    results.forEach((result) => {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        assertValidateErrorDto(result.reason, {
          statusCode: DomainExceptionCode.BadRequest,
          firstFieldName: 'body',
        });
      }
    });

    const passedAnswersVariants = [
      [],
      //::TODO пропускает валидатор, так как правилом что это строка соблюденны (падает ограничение в сущности)
      // [' '],
      ['bla', 8],
      [' Tr', '09', 5],
    ];
    const reqInvalidAnswersPay = passedAnswersVariants.map((ans) => {
      return createQuestionHandler.execute(
        new CreateQuestionCommand('stringstring', ans as string[]),
      );
    });

    const resultsAns = await Promise.allSettled(reqInvalidAnswersPay);

    resultsAns.forEach((result) => {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        assertValidateErrorDto(result.reason, {
          statusCode: DomainExceptionCode.BadRequest,
          firstFieldName: 'correctAnswers',
        });
      }
    });

    const queryParams = new QuestionQueryParams();

    const result = await qetQuestionsWithPagingHandler.execute(
      new GetQuestionsWithPagingQuery(queryParams),
    );
    expect(result.totalCount).toBe(0);
    expect(result.pageSize).toBe(10);
    expect(result.page).toBe(1);
    expect(result.items.length).toBe(0);
  });

  it('Check public view dto after created', async () => {
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

    assertQuestionView(storedQuestion, {
      published: false,
      body: payload.body.trim(),
      correctAnswers: ['body', 'answers', '7+7'],
    });
  });
});
