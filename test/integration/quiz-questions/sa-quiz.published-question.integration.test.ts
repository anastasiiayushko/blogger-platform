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
  TogglePublishQuestionCommand,
  TogglePublishQuestionHandler,
} from '../../../src/modules/quiz/sa-question/application/usecases/toggle-publish-question.usecase';
import { randomUUID } from 'crypto';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { QuestionViewDto } from '../../../src/modules/quiz/sa-question/api/input-dto/question.view-dto';
import { assertQuestionView } from '../../util/assert-view/assert-question-view';
import { QuestionRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.repository';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import { assertValidateErrorDto } from '../../util/assert-error/assert-validate-error-dto';
import { DomainExceptionCode } from '../../../src/core/exceptions/domain-exception-codes';

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
        TypeOrmModule.forFeature([Question]),
      ],
      providers: [
        CreateQuestionHandler,
        TogglePublishQuestionHandler,
        QuestionQueryRepository,
        QuestionRepository,
      ],
    });
    app = appNest;
    dataSource = dS;
    createQuestionHandler = app.get(CreateQuestionHandler);
    togglePublishQuestionHandler = app.get(TogglePublishQuestionHandler);
    questionQueryRepository = app.get(QuestionQueryRepository);
    await ormDBCleaner(dataSource);

    const payload = {
      body: ' How many continents are on Earth?  ',
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
    await ormDBCleaner(dataSource);
  });

  it('should set published = true by questionId.', async () => {
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

  it('should be set published = false by questionId.', async () => {
    await togglePublishQuestionHandler.execute(
      new TogglePublishQuestionCommand(createdQuestion.id, false),
    );

    const findQuestion = await questionQueryRepository.findOrNotFoundFail(
      createdQuestion.id,
    );

    expect(findQuestion.published).toBe(false);
  });

  it('should be return DomainException if questionId not found.', async () => {
    const notExistingID = randomUUID();

    const error: DomainException = await togglePublishQuestionHandler
      .execute(new TogglePublishQuestionCommand(notExistingID, false))
      .catch((e) => e);
    assertValidateErrorDto(error, { statusCode: DomainExceptionCode.NotFound });
  });

  it('validate input dto command ', async () => {
    const payload = {
      body: ' Check view dto ',
      answers: ['Body', ' body ', 'answers ', '   aNswErs ', '7+7'],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );
    const snapQuestion =
      await questionQueryRepository.findOrNotFoundFail(questionId);

    expect(questionId).toEqual(expect.any(String));

    const error = await togglePublishQuestionHandler
      .execute(
        new TogglePublishQuestionCommand(questionId, '' as unknown as boolean),
      )
      .catch((e) => e);

    assertValidateErrorDto(error, {
      statusCode: DomainExceptionCode.BadRequest,
      firstFieldName: 'published',
    });

    const currentQuestion =
      await questionQueryRepository.findOrNotFoundFail(questionId);

    expect(snapQuestion).toEqual(currentQuestion);
  });

  it('Check view dto, after updated published', async () => {
    const payload = {
      body: ' Check view dto ',
      answers: ['Body', ' body ', 'answers ', '   aNswErs ', '7+7'],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );

    expect(questionId).toEqual(expect.any(String));

    await togglePublishQuestionHandler.execute(
      new TogglePublishQuestionCommand(questionId, true),
    );
    const storedQuestion =
      await questionQueryRepository.findOrNotFoundFail(questionId);

    assertQuestionView(storedQuestion, {
      body: payload.body.trim(),
      correctAnswers: ['body', 'answers', '7+7'],
      published: true,
    });
  });
});
