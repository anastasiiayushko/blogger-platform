import { HttpStatus, INestApplication } from '@nestjs/common';
import request from 'supertest';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { UsersApiManagerHelper } from '../../api-manager/users-api-manager-helper';
import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { SaQuizQuestionApiManager } from '../../api-manager/sa-quiz-question-api-manager';
import { delay } from '../../helpers/delay-helper';
import { GameStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/game/game-statuses.enum';
import { QuestionInputDto } from '../../../src/modules/quiz/sa-question/api/input-dto/question.input-dto';

jest.setTimeout(30000);
describe('Quiz game / auto finish by cron polling (e2e)', () => {
  const basicAuth = getAuthHeaderBasicTest();

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let saQuizQuestionApiManager: SaQuizQuestionApiManager;

  const PAIR_GAME_BASE = '/api/pair-game-quiz';

  const userA = {
    login: 'game-us-a',
    email: 'game-user-a@email.com',
    password: 'test123456',
  };

  const userB = {
    login: 'game-us-b',
    email: 'game-user-b@email.com',
    password: 'test123456',
  };

  async function authHeaderForUser(
    loginOrEmail: string,
    password: string,
  ): Promise<{ Authorization: string }> {
    const loginRes = await userApiManager.login({ loginOrEmail, password });
    expect(loginRes.status).toBe(HttpStatus.OK);
    return {
      Authorization: `Bearer ${loginRes.body.accessToken}`,
    };
  }

  async function createAndPublishQuestions(count: number): Promise<void> {
    for (let i = 0; i < count; i++) {
      const createRes = await saQuizQuestionApiManager.create({
        body: `Auto-finish question ${i} ${Date.now()}`,
        correctAnswers: ['correct'],
      } as QuestionInputDto);
      expect(createRes.status).toBe(HttpStatus.CREATED);

      const publishRes = await saQuizQuestionApiManager.togglePublish(
        createRes.body.id,
        {
          published: true,
        },
      );
      expect(publishRes.status).toBe(HttpStatus.NO_CONTENT);

      // Throttler is enabled in testing env.
      await delay(700);
    }
  }

  async function postConnection(authHeader: { Authorization: string }) {
    return request(app.getHttpServer())
      .post(`${PAIR_GAME_BASE}/pairs/connection`)
      .set(authHeader);
  }

  async function postAnswer(
    authHeader: { Authorization: string },
    answer: string,
  ) {
    return request(app.getHttpServer())
      .post(`${PAIR_GAME_BASE}/pairs/my-current/answers`)
      .set(authHeader)
      .send({ answer });
  }

  async function getGame(
    authHeader: { Authorization: string },
    gameId: string,
  ) {
    return request(app.getHttpServer())
      .get(`${PAIR_GAME_BASE}/pairs/${gameId}`)
      .set(authHeader);
  }

  async function waitForFinishedGame(
    authHeader: { Authorization: string },
    gameId: string,
  ) {
    const timeoutMs = 22000;
    const pollingEveryMs = 1200;
    const startedAt = Date.now();

    while (Date.now() - startedAt < timeoutMs) {
      const gameRes = await getGame(authHeader, gameId);
      expect(gameRes.status).toBe(HttpStatus.OK);

      if (gameRes.body.status === GameStatusesEnum.finished) {
        return gameRes.body;
      }

      await delay(pollingEveryMs);
    }

    throw new Error(
      `Game ${gameId} was not finished in ${timeoutMs}ms by cron auto-close`,
    );
  }

  beforeAll(async () => {
    const init = await setupNextAppHttp();
    app = init.app;
    userApiManager = init.userTestManger;
    saQuizQuestionApiManager = new SaQuizQuestionApiManager(app);

  });

  afterAll(async () => {
    await app.close();
  });


  it('should auto-finish game by cron without manual handleCron call', async () => {
    await createAndPublishQuestions(5);

    const createdUserA = await userApiManager.createUser(userA, basicAuth);
    expect(createdUserA.status).toBe(HttpStatus.CREATED);

    const createdUserB = await userApiManager.createUser(userB, basicAuth);
    expect(createdUserB.status).toBe(HttpStatus.CREATED);

    const authA = await authHeaderForUser(userA.login, userA.password);
    const authB = await authHeaderForUser(userB.login, userB.password);

    const firstConnect = await postConnection(authA);
    expect(firstConnect.status).toBe(HttpStatus.OK);
    expect(firstConnect.body.status).toBe(GameStatusesEnum.pending);

    const secondConnect = await postConnection(authB);
    expect(secondConnect.status).toBe(HttpStatus.OK);
    expect(secondConnect.body.status).toBe(GameStatusesEnum.active);

    const gameId = secondConnect.body.id as string;
    expect(gameId).toBeTruthy();

    for (let i = 0; i < 5; i++) {
      const res = await postAnswer(authA, 'wrong');
      expect(res.status).toBe(HttpStatus.OK);
    }
    await delay(2800);

    for (let i = 0; i < 2; i++) {
      const res = await postAnswer(authB, 'wrong');
      expect(res.status).toBe(HttpStatus.OK);
    }
    await delay(2800);


    const finishedGame = await getGame(authA, gameId);

    await delay(2800);
    console.log('finishedGame', finishedGame);
    // const finishedGame = await waitForFinishedGame(authA, gameId);

    expect(finishedGame.status).toBe(GameStatusesEnum.finished);
    // expect(finishedGame.finishGameDate).not.toBeNull();
    // expect(finishedGame.secondPlayerProgress.answers).toHaveLength(5);
  }, 11000);
});
