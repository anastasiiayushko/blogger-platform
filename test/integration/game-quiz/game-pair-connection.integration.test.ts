import { setupTestApp } from '../../setup-app/setup-test-app';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../../src/app.module';
import { SaCreateUserHandler } from '../../../src/modules/user-accounts/application/sa-users-usecases/sa-create-user.usecase';
import {
  GamePairConnectionCmd,
  GamePairConnectionHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/game-pair-connection.usecese';
import { DataSource, Repository } from 'typeorm';
import { ormDBCleaner } from '../../util/orm-db-cleaner';
import { FillQuestionsSeed } from '../../../seeds/fill-questions.seed';
import { Game } from '../../../src/modules/quiz/quiz-game/domain/game/game.entity';
import { GameStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/game/game-statuses.enum';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { GameQueryRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/query/game.query-repository';
import { GamePairViewDto } from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/game-pair.view-dto';
import { assertGamePairView } from '../../util/assert-view/assert-game-pair-view';

describe('Game Pair Connection Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let gameQueryRepository: GameQueryRepository;
  let gameRepo: Repository<Game>;
  let user_1_id;
  let user_2_id;
  let user_3_id;

  async function serverCreateUser() {
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
  }

  let dataSource: DataSource;
  beforeAll(async () => {
    const { appNest, dataSource: dS } = await setupTestApp({
      imports: [AppModule],
    });
    app = appNest;
    saCreateUserHandler = appNest.get(SaCreateUserHandler);
    gamePairConnectionHandler = appNest.get(GamePairConnectionHandler);
    gameQueryRepository = appNest.get(GameQueryRepository);
    dataSource = dS;
    gameRepo = dataSource.getRepository(Game);

    await ormDBCleaner(dS);
    await FillQuestionsSeed.up(dataSource);

    await serverCreateUser();
  });
  afterAll(async () => {
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
    expect(gameInPending!.createdAt).toBeInstanceOf(Date);
    expect(gameInPending!.startGameDate).toBeNull();
    expect(gameInPending!.finishGameDate).toBeNull();
    expect(gameInPending!.secondPlayerId).toBeNull();
    expect(gameInPending!.questions).toEqual([]);

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
    expect(gameInStart!.createdAt).toBeInstanceOf(Date);
    expect(gameInStart!.finishGameDate).toBeNull();
    expect(gameInStart!.secondPlayer?.userId).toBe(user_2_id);
    expect(gameInStart!.questions!.length).toBe(5);
  });

  it(`should be return error if player want to join to new game, not finished prev game`, async () => {
    await expect(
      gamePairConnectionHandler.execute(new GamePairConnectionCmd(user_2_id)),
    ).rejects.toBeInstanceOf(DomainException);
    const games = await gameRepo.find({
      relations: {
        firstPlayer: { user: true },
        secondPlayer: { user: true },
      },
    });
    console.log('games', games);
  });

  it(`user_3 should be create new Game and awaiting pair`, async () => {
    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_3_id),
    );
    const games = await gameRepo.find({
      relations: {
        firstPlayer: { user: true },
        secondPlayer: { user: true },
      },
    });
    console.log('games', games);
    const game = (await gameQueryRepository.findUnfinishedGameByUserId(
      user_3_id,
    )) as GamePairViewDto;

    assertGamePairView(game, {
      status: GameStatusesEnum.pending,
      firstPlayer: {
        score: 0,
        login: 'player3',
        answers: [],
      },
      secondPlayer: null,
    });
  });

  it(`should not allow player to join his own pending game`, async () => {
    await ormDBCleaner(dataSource);
    await FillQuestionsSeed.up(dataSource);

    const userId = await saCreateUserHandler.execute({
      login: 'player4',
      email: 'player4@example.com',
      password: 'player4',
    });

    await gamePairConnectionHandler.execute(new GamePairConnectionCmd(userId));

    await expect(
      gamePairConnectionHandler.execute(new GamePairConnectionCmd(userId)),
    ).rejects.toBeInstanceOf(DomainException);
  });
});
