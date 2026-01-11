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
import { AnswerStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/answer/answer-statuses.enum';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import { DomainException } from '../../../src/core/exceptions/domain-exception';

describe('Quiz: Sync AnswerQuestion Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let recordCurrentAnswerHandler;
  let gameQueryRepository: GameQueryRepository;
  let gameRepository: GameRepository;
  let user_1_id;
  let user_2_id;
  let userCounter = 3;

  let dataSource: DataSource;
  const createUser = async () => {
    const index = userCounter++;
    return saCreateUserHandler.execute({
      login: `player${index}`,
      email: `player${index}@example.com`,
      password: 'player',
    });
  };
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
  });

  beforeEach(async () => {
    userCounter = 3;
    await ormDBCleaner(dataSource);
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
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const correctAnswerIndex = [0, 2, 3];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_1_id, answer),
      );
    }

    for await (const i of positionQuestion) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
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
    expect(finishedGame?.finishGameDate).not.toBeNull();
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
      //@ts-ignore
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
      //@ts-ignore
      const question = gameQuestions[i].question;
      const correctAnswerIndex = [0, 4];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      const result = await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_1_id, answer),
      );
      expect(result).toEqual({
        questionId: question.id,
        answerStatus: correctAnswerIndex.includes(i)
          ? AnswerStatusesEnum.correct
          : AnswerStatusesEnum.incorrect,
        addedAt: expect.any(String),
      });
    }

    for await (const i of positionQuestion) {
      //@ts-ignore
      const question = gameQuestions[i].question;
      const correctAnswerIndex = [1, 2, 3];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      const result = await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(user_2_id, answer),
      );
      expect(result).toEqual({
        questionId: question.id,
        answerStatus: correctAnswerIndex.includes(i)
          ? AnswerStatusesEnum.correct
          : AnswerStatusesEnum.incorrect,
        addedAt: expect.any(String),
      });
    }

    const finishedGame = await gameQueryRepository.findGameById(currentGameId);

    expect(finishedGame?.firstPlayerProgress.score).toBe(3);
    expect(finishedGame?.secondPlayerProgress!.score).toBe(3);
    expect(finishedGame?.status).toBe(GameStatusesEnum.finished);
  });

  it(`должен вернуть ошибку если игра еще не активна`, async () => {
    const userId = await createUser();

    await gamePairConnectionHandler.execute(new GamePairConnectionCmd(userId));

    await expect(
      recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userId, 'some answer'),
      ),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it(`должен вернуть ошибку если игрок отвечает более 5 раз`, async () => {
    const userA = await createUser();
    const userB = await createUser();

    await gamePairConnectionHandler.execute(new GamePairConnectionCmd(userA));
    await gamePairConnectionHandler.execute(new GamePairConnectionCmd(userB));

    const currentGame = await gameRepository.findActiveGameByUserId(userA);
    const gameQuestions = currentGame!.questions;

    for (const i of [0, 1, 2, 3, 4]) {

      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userA, question.answers[0]),
      );
    }

    await expect(
      recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userA, 'some answer'),
      ),
    ).rejects.toBeInstanceOf(DomainException);
  });

  it(`должен начислять бонус второму игроку если он ответил быстрее и имеет верный ответ`, async () => {
    const userA = await createUser();
    const userB = await createUser();

    const currentGameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(userA),
    );
    await gamePairConnectionHandler.execute(new GamePairConnectionCmd(userB));

    const currentGame = await gameRepository.findActiveGameByUserId(userA);
    const gameQuestions = currentGame!.questions;

    for (const i of [0, 1, 2, 3, 4]) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const answer = [0, 1].includes(i) ? question.answers[0] : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userB, answer),
      );
    }

    for (const i of [0, 1, 2, 3, 4]) {
      //@ts-ignore
      const question = gameQuestions[i].question as Question;
      const answer = [0, 1].includes(i) ? question.answers[0] : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userA, answer),
      );
    }

    const finishedGame = await gameQueryRepository.findGameById(currentGameId);

    expect(finishedGame?.firstPlayerProgress.score).toBe(2);
    expect(finishedGame?.secondPlayerProgress!.score).toBe(3);
    expect(finishedGame?.status).toBe(GameStatusesEnum.finished);
  });
});
