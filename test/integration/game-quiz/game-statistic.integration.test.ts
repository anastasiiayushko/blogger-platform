import { setupTestApp } from '../../setup-app/setup-test-app';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { DataSource } from 'typeorm';
import { ormDBCleaner } from '../../util/orm-db-cleaner';
import { FillQuestionsSeed } from '../../../seeds/fill-questions.seed';
import { GameStatisticQueryRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/query/game-statistic.query-repository';
import { GameStatisticViewDto } from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/game-statistic.view-dto';
import { gameTestDriver } from '../../helpers/game/game-test-driver';
import { makeSaCreateUserHelper } from '../../helpers/sa-create-user/make-sa-create-user.helper';
import { delay } from '../../helpers/delay-helper';

describe('Quiz: game statistic', () => {
  let app: INestApplication;
  let gameStatisticQueryRepo: GameStatisticQueryRepository;
  let dataSource: DataSource;
  let gameRunner;
  let saCreateUser;

  beforeAll(async () => {
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [AppModule],
    });
    app = appNest;
    gameStatisticQueryRepo = appNest.get(GameStatisticQueryRepository);
    dataSource = dS;

    await ormDBCleaner(dataSource);
    await FillQuestionsSeed.up(dataSource);
    saCreateUser = makeSaCreateUserHelper(app);
    gameRunner = gameTestDriver(app);
  });

  afterAll(async () => {
    // await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`statistic for user's by finished game`, async () => {
    const firstUserId = await saCreateUser();
    const secondUserId = await saCreateUser();
    await gameRunner(2, 3, 'first', firstUserId, secondUserId); // ничья
    await delay(80);
    await gameRunner(5, 3, 'first', firstUserId, secondUserId); //  user1 win
    await delay(60);
    await gameRunner(1, 4, 'second', firstUserId, secondUserId); // user2 win
    await delay(60);
    await gameRunner(0, 1, 'first', firstUserId, secondUserId); // user2 win
    await delay(10);
    await gameRunner(4, 1, 'second', firstUserId, secondUserId); // user1 win

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
