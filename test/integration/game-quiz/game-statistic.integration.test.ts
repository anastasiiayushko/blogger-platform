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
import {
  RecordCurrentAnswerCommand,
  RecordCurrentAnswerHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/record-current-answer.usecese';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import { Game } from '../../../src/modules/quiz/quiz-game/domain/game/game.entity';
import { GameStatisticQueryRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/query/game-statistic.query-repository';
import { GameStatisticViewDto } from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/game-statistic.view-dto';

describe('Quiz: Concurrency AnswerQuestion Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let recordCurrentAnswerHandler;
  let gameStatisticQueryRepo: GameStatisticQueryRepository;
  let dataSource: DataSource;

  function makeSaCreateUser() {
    let v = 0;
    return async (): Promise<string> => {
      const userId = await saCreateUserHandler.execute({
        login: 'player' + v,
        email: `player${v}@example.com`,
        password: `player${v}`,
      });
      v++;
      return userId;
    };
  }

  const saCreateUser = makeSaCreateUser();

  async function newGame(
    firstUserId: string,
    secondUserId: string,
  ): Promise<string> {
    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(firstUserId),
    );
    const gameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(secondUserId),
    );
    return gameId;
  }

  async function startGame(
    correctAnswersPlayer1: number = 0,
    correctAnswersPlayer2: number = 0,
    whoStartFirst: 'first' | 'second' = 'first',
    firsPlayerUserId: string,
    secondPlayerUserId: string,
  ) {
    const gameId = await newGame(firsPlayerUserId, secondPlayerUserId);
    const game = await dataSource.getRepository(Game).findOne({
      where: { id: gameId },
      relations: { questions: { question: true } },
      order: {
        questions: {
          order: 'ASC',
        },
      },
    });
    const gameQuestions = game!.questions;
    const positionQuestion = [0, 1, 2, 3, 4];

    const firstUserId =
      whoStartFirst === 'first' ? firsPlayerUserId : secondPlayerUserId;
    const secondUserId =
      whoStartFirst === 'first' ? secondPlayerUserId : firsPlayerUserId;

    const correctAnswersForPlayers: Record<'first' | 'second', number[]> = {
      first: new Array(correctAnswersPlayer1).fill(0).map((_, i) => i),
      second: new Array(correctAnswersPlayer2).fill(0).map((_, i) => i),
    };

    for (const i of positionQuestion) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const answerPlayer1 = correctAnswersForPlayers[
        whoStartFirst === 'first' ? 'first' : 'second'
      ].includes(i)
        ? question.answers[0]
        : 'some answer';

      const answerPlayer2 = correctAnswersForPlayers[
        whoStartFirst === 'first' ? 'second' : 'first'
      ].includes(i)
        ? question.answers[0]
        : 'some answer';

      const [player1Result, player2Result] = await Promise.allSettled([
        await recordCurrentAnswerHandler.execute(
          new RecordCurrentAnswerCommand(firstUserId, answerPlayer1),
        ),
        await recordCurrentAnswerHandler.execute(
          new RecordCurrentAnswerCommand(secondUserId, answerPlayer2),
        ),
      ]);

      expect(player1Result.status).toBe('fulfilled');
      expect(player2Result.status).toBe('fulfilled');
    }

    return {
      gameId: gameId,
    };
  }

  beforeAll(async () => {
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [AppModule],
    });
    app = appNest;
    saCreateUserHandler = appNest.get(SaCreateUserHandler);
    gamePairConnectionHandler = appNest.get(GamePairConnectionHandler);
    recordCurrentAnswerHandler = appNest.get(RecordCurrentAnswerHandler);
    gameStatisticQueryRepo = appNest.get(GameStatisticQueryRepository);
    dataSource = dS;

    await ormDBCleaner(dataSource);
    await FillQuestionsSeed.up(dataSource);
  });

  afterAll(async () => {
    // await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`statistic for user's by finished game`, async () => {
    const firstUserId = await saCreateUser();
    const secondUserId = await saCreateUser();
    await startGame(2, 3, 'first', firstUserId, secondUserId); // ничья
    await startGame(5, 3, 'first', firstUserId, secondUserId); //  user1 win
    await startGame(1, 4, 'second', firstUserId, secondUserId); // user2 win
    await startGame(0, 1, 'first', firstUserId, secondUserId); // user2 win
    await startGame(4, 1, 'second', firstUserId, secondUserId); // user1 win

    const expectedStatisticUser1: GameStatisticViewDto = {
      winsCount: 2,
      drawsCount: 1,
      lossesCount: 2,
      avgScores: 2.6,
      sumScore: 13,
      gamesCount: 5,
    };

    const receivedStatisticUser1 =
      await gameStatisticQueryRepo.findStatisticByUserId(firstUserId);
    expect(expectedStatisticUser1).toEqual(receivedStatisticUser1);

    const expectedStatisticUser2: GameStatisticViewDto = {
      winsCount: 2,
      drawsCount: 1,
      lossesCount: 2,
      avgScores: 2.8,
      sumScore: 14,
      gamesCount: 5,
    };

    const receivedStatisticUser2 =
      await gameStatisticQueryRepo.findStatisticByUserId(secondUserId);
    expect(expectedStatisticUser2).toEqual(receivedStatisticUser2);
  });

  it(`should return default statistics if the user has not participated in any games `, async () => {
    const firstUserId = await saCreateUser();

    const expectedStatisticUser1: GameStatisticViewDto = {
      winsCount: 0,
      drawsCount: 0,
      lossesCount: 0,
      avgScores: 0,
      sumScore: 0,
      gamesCount: 0,
    };

    const receivedStatistic =
      await gameStatisticQueryRepo.findStatisticByUserId(firstUserId);

    expect(expectedStatisticUser1).toEqual(receivedStatistic);
  });
});
