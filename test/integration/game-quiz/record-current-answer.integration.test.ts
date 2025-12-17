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
import { GameQueryRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/query/game.query-repository';
import { assertGamePairView } from '../../util/assert-view/assert-game-pair-view';
import { GamePairViewDto } from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/game-pair.view-dto';
import {
  RecordCurrentAnswerCommand,
  RecordCurrentAnswerHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/record-current-answer.usecese';
import { GameRepository } from '../../../src/modules/quiz/quiz-game/infrastructure/game.repository';

describe('Game Pair Connection Integration', () => {
  let app: INestApplication;
  let saCreateUserHandler;
  let gamePairConnectionHandler;
  let recordCurrentAnswerHandler;
  let gameQueryRepository: GameQueryRepository;
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

  it(`should be create new game first player -> user_1 and success join second player -> user_2`, async () => {
    const createdGameId = await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_1_id),
    );

    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(user_2_id),
    );
    const currentGame = await gameRepository.findActiveGameByUserId(user_1_id);

    const questions = currentGame!.questions;

    const answer1 = await recordCurrentAnswerHandler.execute(
      new RecordCurrentAnswerCommand(user_1_id, 'bla'),
    );
    const answer2 = await recordCurrentAnswerHandler.execute(
      new RecordCurrentAnswerCommand(user_1_id, 'bla'),
    );

    const answer3 = await recordCurrentAnswerHandler.execute(
      new RecordCurrentAnswerCommand(user_1_id, 'bla'),
    );
    const answer4 = await recordCurrentAnswerHandler.execute(
      new RecordCurrentAnswerCommand(user_1_id, 'bla'),
    );
    const answer5 = await recordCurrentAnswerHandler.execute(
      new RecordCurrentAnswerCommand(user_1_id, 'bla'),
    );
  });
});
