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
  ) {}

  async execute(cmd: GamePairConnectionCmd): Promise<string> {
    await cmd.validateOrFail();

    const unFinishGame = await this.gameRepo.findUnFinishGameByUser(cmd.userId);

    if (unFinishGame) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'current user is already participating in active pair',
      });
    }

    const gameInAwaitSecondPlayer = await this.gameRepo.findGameInStatusPending(
      cmd.userId,
    );
    if (gameInAwaitSecondPlayer) {
      const secondPlayer = Player.createPlayer({
        userId: cmd.userId,
      });

      gameInAwaitSecondPlayer.joinSecondPlayer(secondPlayer.id);

      const randomQuestion = await this.questionRepository.getRandomQuestion();

      const gameQuestions = GameQuestion.createMany(
        randomQuestion,
        gameInAwaitSecondPlayer.id,
      );
      gameInAwaitSecondPlayer.assignQuestions(gameQuestions);

      gameInAwaitSecondPlayer.startGame();
      await this.playerRepository.save(secondPlayer);
      await this.gameRepo.save(gameInAwaitSecondPlayer);

      return gameInAwaitSecondPlayer.id;
    }

    //crate new game and apply first player
    const playerFirst = Player.createPlayer({
      userId: cmd.userId,
    });
    const newGame = Game.createPending({
      firstPlayerId: playerFirst.id,
    });

    await this.playerRepository.save(playerFirst);
    await this.gameRepo.save(newGame);

    return newGame.id;
  }
}
