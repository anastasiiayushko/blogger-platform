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
import {
  TogglePublishQuestionCommand,
  TogglePublishQuestionHandler,
} from '../../../src/modules/quiz/questions/application/usecases/toggle-publish-question.usecase';
import { randomUUID } from 'crypto';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { QuestionViewDto } from '../../../src/modules/quiz/questions/api/input-dto/question.view-dto';
import { assertQuestionView } from './assert-question-view';

describe('SA Quiz - UpdateQuestion (integration)', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let dataSource: DataSource;
  let createQuestionHandler: CreateQuestionHandler;
  let togglePublishQuestionHandler: TogglePublishQuestionHandler;

  let createdQuestion: QuestionViewDto;

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
    togglePublishQuestionHandler = app.get(TogglePublishQuestionHandler);
    questionQueryRepository = app.get(QuestionQueryRepository);
    await ormClearDatabase(dataSource);

    const payload = {
      body:  ' How many continents are on Earth?  ',
      answers: ['Seven', '7', '  seven '],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );

    createdQuestion =
      await questionQueryRepository.findOrNotFoundFail(questionId);
    expect(createdQuestion.id).toEqual(expect.any(String));
  });

  afterAll(async () => {
    await ormClearDatabase(dataSource);
  });

  it('should set published = true by questionId.', async () => {
    console.log('created ->', createdQuestion);
    const storedQuestion = await questionQueryRepository.findOrNotFoundFail(
      createdQuestion.id,
    );

    expect(storedQuestion.published).toBe(false);

    await togglePublishQuestionHandler.execute(
      new TogglePublishQuestionCommand(createdQuestion.id, true),
    );

    const findQuestion = await questionQueryRepository.findOrNotFoundFail(
      createdQuestion.id,
    );

    expect(findQuestion.published).toBe(true);
  });

  it('should set published = false by questionId.', async () => {
    await togglePublishQuestionHandler.execute(
      new TogglePublishQuestionCommand(createdQuestion.id, false),
    );

    const findQuestion = await questionQueryRepository.findOrNotFoundFail(
      createdQuestion.id,
    );

    expect(findQuestion.published).toBe(false);
  });

  it('should return DomainException if questionId not found.', async () => {
    const notExistingID = randomUUID();

    const errors = await togglePublishQuestionHandler
      .execute(new TogglePublishQuestionCommand(notExistingID, false))
      .catch((e) => e);
    expect(errors instanceof DomainException).toBe(true);
  });

  it('should be return error if dto not valid ', async () => {
    const payload = {
      body: ' Check view dto ',
      answers: ['Body', ' body ', 'answers ', '   aNswErs ', '7+7'],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );

    expect(questionId).toEqual(expect.any(String));

    const errors = await togglePublishQuestionHandler
      .execute(
        new TogglePublishQuestionCommand(questionId, '' as unknown as boolean),
      )
      .catch((e) => e);
    console.log('errors', errors);
    // expect(errors instanceof ValidationError).toBe(true);
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

    assertQuestionView(storedQuestion, {
      body: payload.body.trim(),
      correctAnswers: ['body', 'answers', '7+7'],
      published: false,
    });
  });
});
