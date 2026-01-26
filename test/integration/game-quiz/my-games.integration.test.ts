import { setupTestApp } from '../../setup-app/setup-test-app';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import {
  GamePairConnectionCmd,
  GamePairConnectionHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/game-pair-connection.usecese';
import { DataSource } from 'typeorm';
import { ormDBCleaner } from '../../util/orm-db-cleaner';
import { FillQuestionsSeed } from '../../../seeds/fill-questions.seed';
import {
  RecordCurrentAnswerHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/record-current-answer.usecese';
import {
  GameStatisticQueryRepository,
} from '../../../src/modules/quiz/quiz-game/infrastructure/query/game-statistic.query-repository';
import {
  GameStatisticViewDto,
} from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/game-statistic.view-dto';
import { gameTestDriver } from '../../helpers/game/game-test-driver';
import { makeSaCreateUserHelper } from '../../helpers/sa-create-user/make-sa-create-user.helper';
import { delay } from '../../helpers/delay-helper';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  MyGamesQuery,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/query-useceses/my-game.query-usecase';
import {
  MyGameSortByEnum,
  MyGamesQueryDto,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/api/input-dto/my-games-query-params.input-dto';
import { GameStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/game/game-statuses.enum';
import { SortDirection } from '../../../src/core/dto/base.query-params.input-dto';

describe('Quiz:  my games', () => {
  let app: INestApplication;
  let queryBus: QueryBus;
  let commandBus: CommandBus;
  let dataSource: DataSource;
  let gameRunner;
  let saCreateUser;
  let firstUserId, secondUserId;

  beforeAll(async () => {
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [AppModule],
    });
    app = appNest;
    dataSource = dS;
    queryBus = appNest.get(QueryBus);
    commandBus = appNest.get(CommandBus);

    await ormDBCleaner(dataSource);
    await FillQuestionsSeed.up(dataSource);
    saCreateUser = makeSaCreateUserHelper(app);
    gameRunner = gameTestDriver(app);

    firstUserId = await saCreateUser();
    secondUserId = await saCreateUser();
  });

  afterAll(async () => {
    // await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`firstUserId dont has games`, async () => {
    const games = await queryBus.execute(
      new MyGamesQuery(firstUserId, new MyGamesQueryDto()),
    );
    expect(games.totalCount).toBe(0);
    expect(games.items.length).toBe(0);
  });
  it(`Get all of the player's games. It is expected that he only has completed games.`, async () => {
    await gameRunner(2, 3, 'first', firstUserId, secondUserId);

    const games = await queryBus.execute(
      new MyGamesQuery(firstUserId, new MyGamesQueryDto()),
    );
    expect(games.totalCount).toBe(1);
    expect(games.items[0].status).toBe(GameStatusesEnum.finished);
  });

  it(`set more games. should be  return  all games (finished and current) `, async () => {
    await gameRunner(2, 3, 'first', firstUserId, secondUserId);
    await gameRunner(2, 3, 'first', firstUserId, secondUserId);
    await gameRunner(2, 3, 'first', firstUserId, secondUserId);
    await gameRunner(2, 3, 'first', firstUserId, secondUserId);
    await gameRunner(2, 3, 'first', firstUserId, secondUserId);

    await delay(100);

    const newGameId = await commandBus.execute(
      new GamePairConnectionCmd(firstUserId),
    );

    const gamesQueryDto =new MyGamesQueryDto();
    gamesQueryDto.sortBy = MyGameSortByEnum.startGameDate;
    gamesQueryDto.sortDirection = SortDirection.Asc;
    const games = await queryBus.execute(
      new MyGamesQuery(firstUserId, gamesQueryDto),
    );

    console.log('games ->', games);
  });
});
