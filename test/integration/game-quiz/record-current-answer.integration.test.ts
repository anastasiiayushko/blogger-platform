import { setupTestApp } from '../../setup-app/setup-test-app';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { SaCreateUserHandler } from '../../../src/modules/user-accounts/application/sa-users-usecases/sa-create-user.usecase';
import {
  GamePairConnectionCmd,
  GamePairConnectionHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/game-pair-connection.usecese';
import { DataSource } from 'typeorm';
import { ormDBCleaner } from '../../util/orm-db-cleaner';
import { FillQuestionsSeed } from '../../../seeds/fill-questions.seed';
import { GameStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/game/game-statuses.enum';
import { GameQueryRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/query/game.query-repository';
import {
  RecordCurrentAnswerCommand,
  RecordCurrentAnswerHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/record-current-answer.usecese';
import { GameRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/game.repository';

describe('Quiz: Sync AnswerQuestion Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let recordCurrentAnswerHandler;
  let gameQueryRepository: GameQueryRepository;
  let gameRepository: GameRepository;
  let user_1_id;
  let user_2_id;

  let dataSource: DataSource;
  beforeAll(async () => {
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [AppModule],
    });
    app = appNest;
    saCreateUserHandler = appNest.get(SaCreateUserHandler);
    gamePairConnectionHandler = appNest.get(GamePairConnectionHandler);
    recordCurrentAnswerHandler = appNest.get(RecordCurrentAnswerHandler);
    gameQueryRepository = appNest.get(GameQueryRepository);
    gameRepository = appNest.get(GameRepository);
    dataSource = dS;
    await ormDBCleaner(dS);
    await FillQuestionsSeed.up(dataSource);

    user_1_id = await saCreateUserHandler.execute({
      login: 'player1',
      email: 'player1@example.com',
      password: 'player1',
    });
    expect(user_1_id).toBeDefined();

    user_2_id = await saCreateUserHandler.execute({
      login: 'player2',
      email: 'player2@example.com',
      password: 'player2',
    });
    expect(user_2_id).toBeDefined();
  });
  afterAll(async () => {
    // await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`Игрок А(user_1) ответил быстрее Игрока Б(user_2) кол-во верных ответов равны. Игрок А получает бонусный бал и побеждает`, async () => {
    const currentGameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_1_id),
    );

    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_2_id),
    );
    const currentGame = await gameRepository.findActiveGameByUserId(user_1_id);

    const gameQuestions = currentGame!.questions;
    const positionQuestion = [0, 1, 2, 3, 4];
    for await (const i of positionQuestion) {
      const question = gameQuestions[i].question;
      const correctAnswerIndex = [0, 2, 3];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_1_id, answer),
      );
    }

    for await (const i of positionQuestion) {
      const question = gameQuestions[i].question;
      const correctAnswerIndex = [1, 3, 4];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_2_id, answer),
      );
    }

    const finishedGame = await gameQueryRepository.findGameById(currentGameId);

    expect(finishedGame?.firstPlayerProgress.score).toBe(4);
    expect(finishedGame?.secondPlayerProgress!.score).toBe(3);
    expect(finishedGame?.status).toBe(GameStatusesEnum.finished);
  });
  it(`Игрок А(user_1) ответил быстрее но 0 верных ответов Игрока Б(user_2) ответил на один ворпос верно. Игрок Б побеждает но без начисления бонусного бала`, async () => {
    const currentGameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_1_id),
    );

    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_2_id),
    );
    const currentGame = await gameRepository.findActiveGameByUserId(user_1_id);

    const gameQuestions = currentGame!.questions;
    const positionQuestion = [0, 1, 2, 3, 4];
    for await (const i of positionQuestion) {
      const answer = 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_1_id, answer),
      );
    }

    for await (const i of positionQuestion) {
      const question = gameQuestions[i].question;
      const correctAnswerIndex = [1];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_2_id, answer),
      );
    }

    const finishedGame = await gameQueryRepository.findGameById(currentGameId);

    console.log('finishedGame ->', finishedGame);

    expect(finishedGame?.firstPlayerProgress.score).toBe(0);
    expect(finishedGame?.secondPlayerProgress!.score).toBe(1);
    expect(finishedGame?.status).toBe(GameStatusesEnum.finished);
  });
  it(`Игрок А(user_1) ответил быстрее но 2 верных ответа Игрока Б(user_2) ответил на 3 ворпоса. Игроку А начисляется брнусный бал. В результате будет НИЧЬЯ!`, async () => {
    const currentGameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_1_id),
    );

    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_2_id),
    );
    const currentGame = await gameRepository.findActiveGameByUserId(user_1_id);

    const gameQuestions = currentGame!.questions;
    const positionQuestion = [0, 1, 2, 3, 4];
    for await (const i of positionQuestion) {
      const question = gameQuestions[i].question;
      const correctAnswerIndex = [0, 4];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_1_id, answer),
      );
    }

    for await (const i of positionQuestion) {
      const question = gameQuestions[i].question;
      const correctAnswerIndex = [1, 2, 3];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_2_id, answer),
      );
    }

    const finishedGame = await gameQueryRepository.findGameById(currentGameId);

    expect(finishedGame?.firstPlayerProgress.score).toBe(3);
    expect(finishedGame?.secondPlayerProgress!.score).toBe(3);
    expect(finishedGame?.status).toBe(GameStatusesEnum.finished);
  });
});
