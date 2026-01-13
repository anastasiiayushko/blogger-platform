import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { GameRepository } from '../../../../infrastructure/game.repository';
import { ValidatableCommand } from '../../../../../../../core/validate/validatable-command';
import { IsUUID } from 'class-validator';
import { DomainException } from '../../../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../../../core/exceptions/domain-exception-codes';
import { Player } from '../../../../domain/player/player.entity';
import { QuestionRepository } from '../../../../../sa-question/infrastructure/question.repository';
import { GameQuestion } from '../../../../domain/game-question/game-question.entity';
import { Game } from '../../../../domain/game/game.entity';
import { DataSource, QueryFailedError } from 'typeorm';

export class GamePairConnectionCmd extends ValidatableCommand {
  @IsUUID()
  userId: string;

  constructor(userId: string) {
    super();
    this.userId = userId;
  }
}

@CommandHandler(GamePairConnectionCmd)
export class GamePairConnectionHandler
  implements ICommandHandler<GamePairConnectionCmd>
{
  constructor(
    private readonly gameRepo: GameRepository,
    private playerRepository: PlayerRepository,
    private questionRepository: QuestionRepository,
    private dataSource: DataSource,
  ) {}

  async execute(cmd: GamePairConnectionCmd): Promise<string> {
    await cmd.validateOrFail();

    // create a new query runner
    const queryRunner = this.dataSource.createQueryRunner();
    // establish real database connection using our new query runner
    await queryRunner.connect();

    // lets now open a new transaction:
    await queryRunner.startTransaction();
    const em = queryRunner.manager;

    try {
      const unFinishGame = await this.playerRepository.findUnfinishedGamePlayer(
        cmd.userId,
        em,
      );

      if (unFinishGame) {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'current user is already participating in active pair',
        });
      }

      const gameInAwaitSecondPlayer =
        await this.gameRepo.findGameInStatusPending(cmd.userId, em);

      if (gameInAwaitSecondPlayer) {
        const secondPlayer = Player.createPlayer({
          userId: cmd.userId,
        });

        gameInAwaitSecondPlayer.joinSecondPlayer(secondPlayer);

        const randomQuestion =
          await this.questionRepository.getRandomQuestion();

        const gameQuestions = GameQuestion.createMany(
          randomQuestion,
          gameInAwaitSecondPlayer.id,
        );
        gameInAwaitSecondPlayer.assignQuestions(gameQuestions);

        gameInAwaitSecondPlayer.startGame();
        await this.playerRepository.save(secondPlayer, em);
        await this.gameRepo.save(gameInAwaitSecondPlayer, em);

        await queryRunner.commitTransaction();
        return gameInAwaitSecondPlayer.id;
      }

      //crate new game and apply first player
      const playerFirst = Player.createPlayer({
        userId: cmd.userId,
      });
      const newGame = Game.createPending({
        firstPlayerId: playerFirst.id,
      });

      await this.playerRepository.save(playerFirst, em);
      await this.gameRepo.save(newGame, em);

      await queryRunner.commitTransaction();

      return newGame.id;
    } catch (err) {
      // since we have errors let's rollback changes we made
      await queryRunner.rollbackTransaction();
      if (err instanceof QueryFailedError && err.driverError.code === '23505') {
        throw new DomainException({
          code: DomainExceptionCode.Forbidden,
          message: 'current user is already participating in active pair',
        });
      }
      throw err;
    } finally {
      // you need to release query runner which is manually created:
      await queryRunner.release();
    }
  }
}
