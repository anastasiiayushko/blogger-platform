import { INestApplication } from '@nestjs/common';
import {
  CreateQuestionCommand,
  CreateQuestionHandler,
} from '../../../src/modules/quiz/sa-question/application/usecases/create-question.usecase';
import { CoreModule } from '../../../src/core/core.module';
import { configModule } from '../../../src/dynamic-config-module';
import { DatabaseModule } from '../../../src/core/database/database.module';
import { setupTestApp } from '../../setup-app/setup-test-app';
import { DataSource } from 'typeorm';
import { ormDBCleaner } from '../../util/orm-db-cleaner';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import { QuestionRepository } from '../../../src/modules/quiz/sa-question/infrastructure/question.repository';
import {
  DeleteQuestionCommand,
  DeleteQuestionHandler,
} from '../../../src/modules/quiz/sa-question/application/usecases/delete-question.usecase';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../src/core/exceptions/domain-exception-codes';
import { randomUUID } from 'crypto';
import { assertValidateErrorDto } from '../../util/assert-error/assert-validate-error-dto';
import { QuizGameModule } from '../../../src/modules/quiz/quiz-game.module';

describe('SA Quiz - DeleteQuestion (integration)', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let dataSource: DataSource;
  let deleteQuestionHandler: DeleteQuestionHandler;
  let createQuestionHandler: CreateQuestionHandler;
  let questionRepository: QuestionRepository;

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
    deleteQuestionHandler = app.get(DeleteQuestionHandler);
    createQuestionHandler = app.get(CreateQuestionHandler);
    questionRepository = app.get(QuestionRepository);
    await ormDBCleaner(dataSource);
  });

  afterAll(async () => {
    await app.close();
    await ormDBCleaner(dataSource);
  });

  it('should be delete question by id ', async () => {
    const payload = {
      body: 'How many continents are on Earth?',
      answers: ['Seven', '7', '  seven '],
    };

    const { questionId } = await createQuestionHandler.execute(
      new CreateQuestionCommand(payload.body, payload.answers),
    );
    expect(questionId).toEqual(expect.any(String));

    const storedQuestion =
      await questionRepository.findOrNotFoundFail(questionId);

    expect(storedQuestion.deletedAt).toEqual(null);

    await deleteQuestionHandler.execute(new DeleteQuestionCommand(questionId));

    const deletedQuestion = await questionRepository.findById(questionId);

    expect(deletedQuestion).toEqual(null);

    const questionWithDeleted = await dataSource
      .getRepository(Question)
      .findOne({ where: { id: questionId }, withDeleted: true });

    expect(questionWithDeleted?.deletedAt).toBeInstanceOf(Date);
  });

  it('check validate dto ', async () => {
    const invalidId = 'invalidId';
    const result: DomainException = await deleteQuestionHandler
      .execute(new DeleteQuestionCommand(invalidId))
      .catch((e) => e);
    assertValidateErrorDto(result, {
      statusCode: DomainExceptionCode.BadRequest,
    });
  });

  it('delete not existing questionId', async () => {
    const questionId = randomUUID();
    const result: DomainException = await deleteQuestionHandler
      .execute(new DeleteQuestionCommand(questionId))
      .catch((e) => e);

    assertValidateErrorDto(result, {
      statusCode: DomainExceptionCode.NotFound,
    });
  });
});
