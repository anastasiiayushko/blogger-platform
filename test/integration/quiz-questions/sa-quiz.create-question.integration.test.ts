import { INestApplication } from '@nestjs/common';
import { initSettings } from '../../helpers/init-setting';
import { deleteAllData } from '../../helpers/delete-all-data';
import {
  CreateQuestionCommand,
  CreateQuestionHandler,
} from '../../../src/modules/quiz/questions/application/usecases/create-question.usecase';
import { QuestionQueryRepository } from '../../../src/modules/quiz/questions/infrastructure/question.query-repository';

describe('SA Quiz - CreateQuestion (integration)', () => {
  jest.setTimeout(20000);

  let app: INestApplication;
  let createQuestionHandler: CreateQuestionHandler;
  let questionQueryRepository: QuestionQueryRepository;

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    createQuestionHandler = app.get(CreateQuestionHandler);
    questionQueryRepository = app.get(QuestionQueryRepository);
  });

  afterEach(async () => {
    await deleteAllData(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('persists a newly created question with normalized answers', async () => {
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
});
