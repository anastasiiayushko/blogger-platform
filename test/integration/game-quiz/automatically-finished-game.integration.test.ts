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
import { makeSaCreateUserHelper } from '../../helpers/sa-create-user/make-sa-create-user.helper';
import { GameTaskRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/game-task.repository';
import { da } from '@faker-js/faker';
import { GameTask } from '../../../src/modules/quiz/quiz-game/domain/game-task/game-task.entity';
import { GameTaskService } from '../../../src/modules/quiz/quiz-game/features/pair-game/application/services/game-task.sevice';
import { delay } from '../../helpers/delay-helper';
import { GameTaskStatuses } from '../../../src/modules/quiz/quiz-game/domain/game-task/game-task.statuses.enum';
import { Game } from '../../../src/modules/quiz/quiz-game/domain/game/game.entity';
import { Answer } from '../../../src/modules/quiz/quiz-game/domain/answer/answer.entity';

describe('Quiz: Automatically finished game', () => {
  let app: INestApplication;
  let gamePairConnectionHandler;
  let recordCurrentAnswerHandler;
  let gameQueryRepository: GameQueryRepository;
  let gameRepository: GameRepository;
  let gameTaskRepository: GameTaskRepository;
  let gameTaskService: GameTaskService;
  let createUser: () => Promise<string>;
  let dataSource: DataSource;

  beforeAll(async () => {
    // jest.useFakeTimers();
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [AppModule],
    });
    app = appNest;
    createUser = makeSaCreateUserHelper(appNest);
    gameTaskService = appNest.get(GameTaskService);
    gamePairConnectionHandler = appNest.get(GamePairConnectionHandler);
    recordCurrentAnswerHandler = appNest.get(RecordCurrentAnswerHandler);
    gameQueryRepository = appNest.get(GameQueryRepository);
    gameRepository = appNest.get(GameRepository);
    dataSource = dS;
    await ormDBCleaner(dataSource);
    await FillQuestionsSeed.up(dataSource);
  });

  afterAll(async () => {
    // jest.useRealTimers();

    // await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`Игрок А(user_1) ответил быстрее Игрока Б(user_2) и создает задачу для авто завершении игры через (N) time. Игрок Б не успевает ответить только на 3 вопроса из 5. Игрок А побеждает`, async () => {
    const userA = await createUser();
    const userB = await createUser();
    const currentGameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(userA),
    );

    await gamePairConnectionHandler.execute(new GamePairConnectionCmd(userB));
    const currentGame = await gameRepository.findActiveGameByUserId(userA);

    const gameQuestions = currentGame!.questions;

    //user A send answer on 3 question
    for await (const i of [0, 1, 2]) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const correctAnswerIndex = [0, 1, 2];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userA, answer),
      );
    }
    //user B send answer on 2 question
    for await (const i of [0, 1]) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const correctAnswerIndex = [0, 1];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userB, answer),
      );
    }
    //user A send answer on last 2 question. Init game_task for auto cancel game
    for await (const i of [3, 4]) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const correctAnswerIndex = [0, 1, 2];
      const answer = correctAnswerIndex.includes(i)
        ? question.answers[0]
        : 'some answer';
      await recordCurrentAnswerHandler.execute(
        new RecordCurrentAnswerCommand(userA, answer),
      );
    }
    // user B send answer on 3 question of 5

    await recordCurrentAnswerHandler.execute(
      new RecordCurrentAnswerCommand(userB, 'some answer'),
    );

    const taskInPending = await dataSource.getRepository(GameTask).findOne({
      where: { gameId: currentGameId },
    });

    expect(taskInPending!.status).toEqual(GameTaskStatuses.PENDING);

    await delay(3500);

    await gameTaskService.handleCron();

    const taskDone = await dataSource.getRepository(GameTask).findOne({
      where: { gameId: currentGameId },
    });

    expect(taskDone!.status).toEqual(GameTaskStatuses.DONE);

    const finishedGame = await gameQueryRepository.findGameById(currentGameId);

    // проверяем что у игрока 5 ответов (3 из 5 ответил сам).
    // Проверяем что 2 последних ответа были созданы черзе авто-ответы со статусом "incorrect"
    expect(finishedGame!.secondPlayerProgress!.answers.length).toBe(5);
    expect(finishedGame!.secondPlayerProgress!.answers[3].answerStatus).toBe(
      AnswerStatusesEnum.incorrect,
    );
    expect(finishedGame!.secondPlayerProgress!.answers[4].answerStatus).toBe(
      AnswerStatusesEnum.incorrect,
    );

    expect(finishedGame!.firstPlayerProgress.score).toBe(4);
    expect(finishedGame!.secondPlayerProgress!.score).toBe(2);
    expect(finishedGame!.status).toBe(GameStatusesEnum.finished);
    expect(finishedGame!.finishGameDate).not.toBeNull();
  });
});
