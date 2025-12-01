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

describe('SA Quiz - CreateQuestion (integration)', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let dataSource: DataSource;
  let createQuestionHandler: CreateQuestionHandler;
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
    questionQueryRepository = app.get(QuestionQueryRepository);
    await ormClearDatabase(dataSource);
  });
  afterEach(async () => {
    await ormClearDatabase(dataSource);
  });

  it('should reject invalid payload command', async () => {
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

  it('should be able to create question', async () => {


    await expect(
      createQuestionHandler.execute(
        new CreateQuestionCommand('', ['bla']),
      ),
    ).rejects.toThrow();

  });
});
