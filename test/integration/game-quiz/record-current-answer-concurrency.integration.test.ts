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
import { GameQueryRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/query/game.query-repository';
import {
  RecordCurrentAnswerCommand,
  RecordCurrentAnswerHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/record-current-answer.usecese';
import { GameRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/game.repository';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import { delay } from '../../helpers/delay-helper';

describe('Quiz: Concurrency AnswerQuestion Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let recordCurrentAnswerHandler;
  let gameQueryRepository: GameQueryRepository;
  let gameRepository: GameRepository;

  let currentGameId: string;
  let user_1_id;
  let user_2_id;

  let dataSource: DataSource;

  async function setupDataForGame() {
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

    currentGameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_1_id),
    );
    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_2_id),
    );
  }

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

    await ormDBCleaner(dataSource);
    await FillQuestionsSeed.up(dataSource);

    await setupDataForGame();
  });

  afterAll(async () => {
    // await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`Concurrency answer's both player`, async () => {
    const currentGame = await gameRepository.findActiveGameByUserId(user_1_id);

    expect(currentGame).toBeTruthy();
    const gameQuestions = currentGame!.questions;
    const positionQuestion = [0, 1, 2, 3, 4];
    const correctAnswerIndexPlayer1 = [0, 2, 3];
    const correctAnswerIndexPlayer2 = [1, 3, 4];

    for (const i of positionQuestion) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const answerPlayer1 = correctAnswerIndexPlayer1.includes(i)
        ? question.answers[0]
        : 'some answer';
      const answerPlayer2 = correctAnswerIndexPlayer2.includes(i)
        ? question.answers[0]
        : 'some answer';

      const [player1Result, player2Result] = await Promise.allSettled([
        recordCurrentAnswerHandler.execute(
          new RecordCurrentAnswerCommand(user_1_id, answerPlayer1),
        ),
        delay(100).then(() => {
          console.log('user_2_id', user_2_id, answerPlayer2);
          return recordCurrentAnswerHandler.execute(
            new RecordCurrentAnswerCommand(user_2_id, answerPlayer2),
          );
        }),
      ]);
      expect(player1Result.status).toBe('fulfilled');
      expect(player2Result.status).toBe('fulfilled');
    }

    const finishedGame = await gameQueryRepository.findGameById(currentGameId);
    console.log('finishedGame ->', finishedGame);

    expect(finishedGame).toBeTruthy();
    expect(finishedGame!.firstPlayerProgress.answers).toHaveLength(5);
    expect(finishedGame!.secondPlayerProgress?.answers).toHaveLength(5);
  });
});
