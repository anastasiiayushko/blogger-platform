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
import { GameRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/game.repository';
import { delay } from '../../helpers/delay-helper';
import { Player } from '../../../src/modules/quiz/quiz-game/domain/player/player.entity';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { PlayerGameStatusEnum } from '../../../src/modules/quiz/quiz-game/domain/player/player-game-status.enum';

describe('Game Pair Connection Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let gameRepository: GameRepository;
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
    user_3_id = await saCreateUserHandler.execute({
      login: 'player3',
      email: 'player3@example.com',
      password: 'player3',
    });
    expect(user_3_id).toBeDefined();
  });
  afterAll(async () => {
    await ormDBCleaner(dataSource);
    await app.close();
  });

  it(`one user sends several concurrency command for join to game. first command to need apply to game second command return error `, async () => {
    //  Сохраняем оригинальный метод, чтобы потом вызвать
    //      его внутри мок‑реализации.
    const originalSave = gameRepository.save.bind(gameRepository);

    //  Создает “шпион” — можно подменить реализацию
    //      метода и отслеживать вызовы.
    jest.spyOn(gameRepository, 'save').mockImplementation(async (...args) => {
      await delay(50);
      return originalSave(...args);
    });

    const severalCmd = [
      gamePairConnectionHandler.execute(new GamePairConnectionCmd(user_1_id)),
      delay(10).then(() =>
        gamePairConnectionHandler.execute(new GamePairConnectionCmd(user_1_id)),
      ),
      gamePairConnectionHandler.execute(new GamePairConnectionCmd(user_1_id)),
    ];

    const res = await Promise.allSettled(severalCmd);
    const fulfilled = res.filter((r) => r.status === 'fulfilled');
    const rejected = res.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(2);

    rejected.forEach((item) => {
      // @ts-ignore
      expect(item.reason).toBeInstanceOf(DomainException);
    });

    jest.restoreAllMocks();

    const gameCount = await dataSource.getRepository(Game).count({
      where: {
        status: GameStatusesEnum.pending,
        firstPlayer: { userId: user_1_id },
      },
    });

    expect(gameCount).toBe(1);

    const activePlayerCount = await dataSource.getRepository(Player).count({
      where: {
        userId: user_1_id,
        gameStatus: PlayerGameStatusEnum.joined,
      },
    });
    expect(activePlayerCount).toBe(1);
  });

  it(`game exist in status joined (player_1_id).
  Several user(player_2, player_3) want to concurrency join. 
  Result work  to be next ->one game in status active, second game status pending. `, async () => {
    const severalCmd = [
      gamePairConnectionHandler.execute(new GamePairConnectionCmd(user_2_id)),
      new Promise((resolve, reject) => {
        setTimeout(() => {
          gamePairConnectionHandler
            .execute(new GamePairConnectionCmd(user_3_id))
            .then(resolve, reject);
        }, 0);
      }),
    ];

    const results = await Promise.allSettled(severalCmd);

    results.forEach((item) => {
      expect(item.status).toBe('fulfilled');
      //@ts-ignore
      expect(item.value).toBeDefined();
    });

    const gameStarted = await dataSource.getRepository(Game).findOne({
      relations: {
        firstPlayer: { user: true },
        secondPlayer: { user: true },
      },
      where: {
        status: GameStatusesEnum.active,
        firstPlayer: { userId: user_1_id },
        secondPlayer: { userId: user_2_id },
      },
    });
    expect(gameStarted).toBeDefined();

    const gameCount = await dataSource.getRepository(Game).count({
      where: {
        status: GameStatusesEnum.pending,
        firstPlayer: { userId: user_3_id },
      },
    });
    //
    expect(gameCount).toBe(1);
  });
});
