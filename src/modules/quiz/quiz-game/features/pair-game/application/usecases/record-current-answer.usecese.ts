import { ValidatableCommand } from '../../../../../../../core/validate/validatable-command';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GameRepository } from '../../../../infrastructure/game.repository';
import { DomainException } from '../../../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../../../core/exceptions/domain-exception-codes';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { Player } from '../../../../domain/player/player.entity';

export class RecordCurrentAnswerCommand extends ValidatableCommand {
  @IsNotEmpty()
  @IsString()
  answer: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  constructor(userId: string, answer: string) {
    super();
    this.answer = answer;
    this.userId = userId;
  }
}

type Result = {
  questionId: string;
  answerStatus: string;
  addedAt: string;
};

@CommandHandler(RecordCurrentAnswerCommand)
export class RecordCurrentAnswerHandler
  implements ICommandHandler<RecordCurrentAnswerCommand>
{
  constructor(
    protected gameRepository: GameRepository,
    protected playerRepository: PlayerRepository,
  ) {}

  async execute(command: RecordCurrentAnswerCommand) {
    await command.validateOrFail();

    const game = await this.gameRepository.findActiveGameByUserId(
      command.userId,
    );

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Current game is not active',
      });
    }

    const currentPlayerKey =
      game.firstPlayer.userId === command.userId
        ? 'firstPlayer'
        : 'secondPlayer';
    const opponentPlayerKey =
      currentPlayerKey === 'firstPlayer' ? 'secondPlayer' : 'firstPlayer';

    const currentPlayer = game[currentPlayerKey] as Player;
    const opponentPlayer = game[opponentPlayerKey] as Player;

    console.log('current player ->', currentPlayer);
    const currentQuestion = game.questions[currentPlayer.getIndexAnswer()];

    currentPlayer.addAnswer(currentQuestion.question, command.answer);





    await this.playerRepository.save(currentPlayer);

    await this.gameRepository.save(game);
  }
}
