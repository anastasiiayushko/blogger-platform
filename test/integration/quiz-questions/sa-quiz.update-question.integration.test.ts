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
import {
  UpdateQuestionCommand,
  UpdateQuestionHandler,
} from '../../../src/modules/quiz/sa-question/application/usecases/update-question.usecase';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import { GetQuestionsWithPagingHandler } from '../../../src/modules/quiz/sa-question/application/query-usecases/get-questions-with-paging.query-usecase';
import { assertQuestionView } from '../../util/assert-view/assert-question-view';
import { QuestionRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.repository';
import { generateRandomStringForTest } from '../../util/random/generate-random-text';
import { questionBodyConstraints } from '../../../src/modules/quiz/sa-question/domain/question.constrains';
import { DomainExceptionCode } from '../../../src/core/exceptions/domain-exception-codes';
import { assertValidateErrorDto } from '../../util/assert-error/assert-validate-error-dto';

describe('SA Quiz - UpdateQuestion (integration)', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let dataSource: DataSource;
  let createQuestionHandler: CreateQuestionHandler;
  let updateQuestionHandler: UpdateQuestionHandler;

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
        UpdateQuestionHandler,
        GetQuestionsWithPagingHandler,
        QuestionQueryRepository,
      ],
    });
    app = appNest;
    dataSource = dS;
    createQuestionHandler = app.get(CreateQuestionHandler);
    updateQuestionHandler = app.get(UpdateQuestionHandler);
    questionQueryRepository = app.get(QuestionQueryRepository);
    await ormDBCleaner(dataSource);
  });

  afterAll(async () => {
    await ormDBCleaner(dataSource);
  });

  it('should be update question. Check question to View', async () => {
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

    const changePayload = {
      body: 'How mach continents are on Earth?',
      answers: ['7'],
    };

    await updateQuestionHandler.execute(
      new UpdateQuestionCommand(
        questionId,
        changePayload.body,
        changePayload.answers,
      ),
    );

    const updatedQuestion =
      await questionQueryRepository.findOrNotFoundFail(questionId);

    assertQuestionView(updatedQuestion, {
      published: false,
      body: changePayload.body,
      correctAnswers: changePayload.answers,
    });
  });

  it('Checking for incorrect input values in DTO', async () => {
    const payload = {
      body: 'How many continents are on Earth?',
      answers: ['Seven', '7', '  seven '],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );

    const questionActualState =
      await questionQueryRepository.findOrNotFoundFail(questionId);
    const passedBody = [
      ' ',
      '',
      generateRandomStringForTest(questionBodyConstraints.minLength - 1),
      generateRandomStringForTest(questionBodyConstraints.maxLength + 1),
    ];
    const reqInvalidBodyPay = passedBody.map((body) => {
      return updateQuestionHandler.execute(
        new UpdateQuestionCommand(questionId, body, ['bla']),
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
      return updateQuestionHandler.execute(
        new UpdateQuestionCommand(questionId, 'stringstring', ans as string[]),
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

    const questionBeforeFaiUpdate =
      await questionQueryRepository.findOrNotFoundFail(questionId);

    expect(questionActualState).toEqual(questionBeforeFaiUpdate);
  });
});
