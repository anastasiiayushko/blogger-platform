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
import { Game } from '../../../src/modules/quiz/quiz-game/domain/game/game.entity';
import { GameStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/game/game-statuses.enum';
import { DomainException } from '../../../src/core/exceptions/domain-exception';

describe('Game Pair Connection Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let user_1_id;
  let user_2_id;
  let user_3_id;

  let dataSource: DataSource;
  beforeAll(async () => {
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [AppModule],
    });
    app = appNest;
    saCreateUserHandler = appNest.get(SaCreateUserHandler);
    gamePairConnectionHandler = appNest.get(GamePairConnectionHandler);
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
    user_3_id = await saCreateUserHandler.execute({
      login: 'player3',
      email: 'player3@example.com',
      password: 'player3',
    });
    expect(user_3_id).toBeDefined();
  });
  afterAll(async () => {
    // await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`should be create new game first player -> user_1 and success join second player -> user_2`, async () => {
    const gameIdInPending = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_1_id),
    );
    const gameInPending = await dataSource.getRepository(Game).findOne({
      relations: {
        firstPlayer: true,
        questions: true,
      },
      where: { id: gameIdInPending.id },
    });
    expect(gameInPending!.firstPlayer.userId).toBe(user_1_id);
    expect(gameInPending!.status).toBe(GameStatusesEnum.pending);
    expect(gameInPending!.pairCreatedDate).toBeInstanceOf(Date);
    expect(gameInPending!.startGameDate).toBeNull();
    expect(gameInPending!.finishGameDate).toBeNull();
    expect(gameInPending!.secondPlayerId).toBeNull();
    expect(gameInPending!.questions!.length).toBe(5);

    const gameIdInActive = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_2_id),
    );

    expect(gameIdInActive).toEqual(gameIdInPending);

    const gameInStart = await dataSource.getRepository(Game).findOne({
      where: { id: gameIdInPending.id },
      relations: {
        firstPlayer: true,
        secondPlayer: true,
        questions: true,
      },
    });

    expect(gameInStart!.status).toBe(GameStatusesEnum.active);
    expect(gameInStart!.pairCreatedDate).toBeInstanceOf(Date);
    expect(gameInStart!.pairCreatedDate).toBeInstanceOf(Date);
    expect(gameInStart!.finishGameDate).toBeNull();
    expect(gameInStart!.secondPlayer?.userId).toBe(user_2_id);
    expect(gameInStart!.questions!.length).toBe(5);
  });
  it(`should be return error if player want to join to new game, not finished prev game`, async () => {
    try {
      await gamePairConnectionHandler.execute(
        new GamePairConnectionCmd(user_2_id),
      );
    } catch (e) {
      expect(e).toBeInstanceOf(DomainException);
    }
  });

  it(`user_3 should be create new Game and awaiting pair`, async () => {
    const gameIdInPending = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_3_id),
    );
    const gameInPending = await dataSource.getRepository(Game).findOne({
      relations: {
        firstPlayer: true,
        questions: true,
      },
      where: { id: gameIdInPending },
    });
    expect(gameInPending!.firstPlayer.userId).toBe(user_3_id);
    expect(gameInPending!.status).toBe(GameStatusesEnum.pending);
    expect(gameInPending!.pairCreatedDate).toBeInstanceOf(Date);
    expect(gameInPending!.startGameDate).toBeNull();
    expect(gameInPending!.finishGameDate).toBeNull();
    expect(gameInPending!.secondPlayerId).toBeNull();
    expect(gameInPending!.questions!.length).toBe(5);

    const gameCount = await dataSource
      .getRepository(Game)
      .createQueryBuilder()
      .getCount();

    expect(gameCount).toBe(2);
  });
});
