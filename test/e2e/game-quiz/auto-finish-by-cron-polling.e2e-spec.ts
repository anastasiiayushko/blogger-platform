import { HttpStatus, INestApplication } from '@nestjs/common';
import { setupNextAppHttp } from '../../setup-app/setup-next-app-http';
import { UsersApiManagerHelper } from '../../api-manager/users-api-manager-helper';
import { getAuthHeaderBasicTest } from '../../helpers/auth/basic-auth.helper';
import { SaQuizQuestionApiManager } from '../../api-manager/sa-quiz-question-api-manager';
import { DataSource } from 'typeorm';
import { FillQuestionsSeed } from '../../../seeds/fill-questions.seed';
import { PairQuizGameApiManager } from '../../api-manager/pair-quiz-game.api-manager';
import { GameStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/game/game-statuses.enum';

jest.setTimeout(100_000);
describe('Quiz game / auto finish by cron polling (e2e)', () => {
  const basicAuth = getAuthHeaderBasicTest();

  let app: INestApplication;
  let userApiManager: UsersApiManagerHelper;
  let saQuizQuestionApiManager: SaQuizQuestionApiManager;
  let pairQuizGameApiManager: PairQuizGameApiManager;

  const user1 = {
    login: 'game-us-1',
    email: 'game-user-1@email.com',
    password: 'test123456',
  };
  const user2 = {
    login: 'game-us-2',
    email: 'game-user-2@email.com',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await setupNextAppHttp();
    app = init.app;
    userApiManager = init.userTestManger;
    pairQuizGameApiManager = new PairQuizGameApiManager(app);

    const resUserA = await userApiManager.createUser(
      user1,
      getAuthHeaderBasicTest(),
    );
    expect(resUserA.status).toBe(HttpStatus.CREATED);
    const resUserB = await userApiManager.createUser(
      user2,
      getAuthHeaderBasicTest(),
    );
    expect(resUserB.status).toBe(HttpStatus.CREATED);

    const dataSource = app.get(DataSource);
    await FillQuestionsSeed.up(dataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  it('user2 send 5 correct, user1 send 3 correct -> Await 10sec', async () => {
    const user_1_Jwt = (
      await userApiManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      })
    ).body.accessToken;
    const user_2_Jwt = (
      await userApiManager.login({
        loginOrEmail: user2.login,
        password: user2.password,
      })
    ).body.accessToken;

    const createGame = await pairQuizGameApiManager.connection(user_1_Jwt);
    expect(createGame.status).toBe(HttpStatus.OK);

    const startGame = await pairQuizGameApiManager.connection(user_2_Jwt);
    expect(startGame.status).toBe(HttpStatus.OK);

    const game = startGame.body;

    for (let i = 0; i < 3; i++) {
      const res = await pairQuizGameApiManager.answer(
        { answer: 'correct' },
        user_2_Jwt,
      );
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toEqual({
        questionId: expect.any(String),
        answerStatus: expect.any(String),
        addedAt: expect.any(String),
      });
    }

    for (let i = 0; i < 5; i++) {
      const res = await pairQuizGameApiManager.answer(
        { answer: 'correct' },
        user_1_Jwt,
      );
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toEqual({
        questionId: expect.any(String),
        answerStatus: expect.any(String),
        addedAt: expect.any(String),
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const user_2_MyCurrent = await pairQuizGameApiManager.myCurrent(user_2_Jwt);
    expect(user_2_MyCurrent.status).toBe(HttpStatus.NOT_FOUND);

    const user_1_GetGame = await pairQuizGameApiManager.getGameById(
      game.id,
      user_1_Jwt,
    );
    expect(user_1_GetGame.status).toBe(HttpStatus.OK);
    expect(user_1_GetGame.body.status).toBe(GameStatusesEnum.finished);
    expect(user_1_GetGame.body.firstPlayerProgress.score).toBe(6);
    expect(user_1_GetGame.body!.secondPlayerProgress!.score).toBe(3);
    expect(user_1_GetGame.body!.finishGameDate).not.toBeNull();

    console.log(user_1_GetGame.body);
  }, 100_000);

  it('user2 send 5 correct, user1 send 3 correct -> Await 10sec', async () => {
    const user_1_Jwt = (
      await userApiManager.login({
        loginOrEmail: user1.login,
        password: user1.password,
      })
    ).body.accessToken;
    const user_2_Jwt = (
      await userApiManager.login({
        loginOrEmail: user2.login,
        password: user2.password,
      })
    ).body.accessToken;
    const user_1_answer = await pairQuizGameApiManager.answer(
      { answer: 'correct' },
      user_1_Jwt,
    );
    expect(user_1_answer.status).toBe(HttpStatus.FORBIDDEN);

    console.log('user1 =', user_1_answer.body);
    const createGame = await pairQuizGameApiManager.connection(user_1_Jwt);
    expect(createGame.status).toBe(HttpStatus.OK);

    const startGame = await pairQuizGameApiManager.connection(user_2_Jwt);
    expect(startGame.status).toBe(HttpStatus.OK);

    const game = startGame.body;

    for (let i = 0; i < 3; i++) {
      const res = await pairQuizGameApiManager.answer(
        { answer: 'correct' },
        user_2_Jwt,
      );
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toEqual({
        questionId: expect.any(String),
        answerStatus: expect.any(String),
        addedAt: expect.any(String),
      });
    }

    for (let i = 0; i < 5; i++) {
      const res = await pairQuizGameApiManager.answer(
        { answer: 'correct' },
        user_1_Jwt,
      );
      expect(res.status).toBe(HttpStatus.OK);
      expect(res.body).toEqual({
        questionId: expect.any(String),
        answerStatus: expect.any(String),
        addedAt: expect.any(String),
      });
    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));

    const user_2_MyCurrent = await pairQuizGameApiManager.myCurrent(user_2_Jwt);
    expect(user_2_MyCurrent.status).toBe(HttpStatus.NOT_FOUND);

    const user_1_GetGame = await pairQuizGameApiManager.getGameById(
      game.id,
      user_1_Jwt,
    );
    expect(user_1_GetGame.status).toBe(HttpStatus.OK);
    expect(user_1_GetGame.body.status).toBe(GameStatusesEnum.finished);
    expect(user_1_GetGame.body.firstPlayerProgress.score).toBe(6);
    expect(user_1_GetGame.body!.secondPlayerProgress!.score).toBe(3);
    expect(user_1_GetGame.body!.finishGameDate).not.toBeNull();

    console.log(user_1_GetGame.body);
  }, 100_000);

  it(
    'reproduce race: task can be DONE while game still active',
    async () => {
      const user_1_Jwt = (
        await userApiManager.login({
          loginOrEmail: user1.login,
          password: user1.password,
        })
      ).body.accessToken;

      const user_2_Jwt = (
        await userApiManager.login({
          loginOrEmail: user2.login,
          password: user2.password,
        })
      ).body.accessToken;

      const createGame = await pairQuizGameApiManager.connection(user_1_Jwt);
      expect(createGame.status).toBe(HttpStatus.OK);

      const startGame = await pairQuizGameApiManager.connection(user_2_Jwt);
      expect(startGame.status).toBe(HttpStatus.OK);

      const gameId = startGame.body.id as string;

      for (let i = 0; i < 3; i++) {
        const res = await pairQuizGameApiManager.answer(
          { answer: 'correct' },
          user_2_Jwt,
        );
        expect(res.status).toBe(HttpStatus.OK);
      }

      for (let i = 0; i < 5; i++) {
        const res = await pairQuizGameApiManager.answer(
          { answer: 'correct' },
          user_1_Jwt,
        );
        expect(res.status).toBe(HttpStatus.OK);
      }

      // Попадаем в окно гонки (до "гарантированного" авто-финиша)
      await new Promise((resolve) => setTimeout(resolve, 8_500));

      const [myCurrentA, myCurrentB] = await Promise.all([
        pairQuizGameApiManager.myCurrent(user_2_Jwt),
        pairQuizGameApiManager.myCurrent(user_2_Jwt),
      ]);

      // Иногда тут уже 404, иногда еще 200 — это сигнал race
      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(myCurrentA.status);
      expect([HttpStatus.OK, HttpStatus.NOT_FOUND]).toContain(myCurrentB.status);

      const dataSource = app.get(DataSource);

      const gameRows = await dataSource.query(
        `select id, status, "finishGameDate" from game where id = $1`,
        [gameId],
      );
      const taskRows = await dataSource.query(
        `select id, status, "executeAt", "lockedUntil"
         from game_task
         where game_id = $1
         order by "createdAt" desc
         limit 1`,
        [gameId],
      );

      expect(gameRows.length).toBe(1);
      expect(taskRows.length).toBe(1);

      const gameRow = gameRows[0];
      const taskRow = taskRows[0];

      console.log('RACE CHECK game:', gameRow);
      console.log('RACE CHECK task:', taskRow);

      // Целевая проверка: если task уже DONE, игра обязана быть finished
      if (taskRow.status === 'DONE') {
        expect(gameRow.status).toBe(GameStatusesEnum.finished);
        expect(gameRow.finishGameDate).not.toBeNull();
      }
    },
    100_000,
  );
});
