import { ValidatableCommand } from '../../../../../../../core/validate/validatable-command';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GameRepository } from '../../../../infrastructure/game.repository';
import { DomainException } from '../../../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../../../core/exceptions/domain-exception-codes';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { Player } from '../../../../domain/player/player.entity';
import { AnswerRepository } from '../../../../infrastructure/answer.repository';
import { Answer } from '../../../../domain/answer/answer.entity';
import { AnswerStatusesEnum } from '../../../../domain/answer/answer-statuses.enum';
import { AnswerViewDto } from '../../api/view-dto/answer.view-dto';
import { Question } from '../../../../../sa-question/domain/question.entity';
import { GameQuestion } from '../../../../domain/game-question/game-question.entity';

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

@CommandHandler(RecordCurrentAnswerCommand)
export class RecordCurrentAnswerHandler
  implements ICommandHandler<RecordCurrentAnswerCommand>
{
  constructor(
    protected gameRepository: GameRepository,
    protected playerRepository: PlayerRepository,
    protected answerRepository: AnswerRepository,
  ) {}

  async execute(command: RecordCurrentAnswerCommand): Promise<AnswerViewDto> {
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

    /**
     * application-слой явно проверяет, что
     * обязательные связи не undefined и соответствуют ожиданиям
     * ловим до того, как доменная логика начнёт падать
     * */

    if (!game.firstPlayer || !game.secondPlayer) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Players must be loaded',
      });
    }
    if (!game.firstPlayer.answers || !game.secondPlayer.answers) {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: 'Player answers must be loaded',
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

    if (currentPlayer.hasAnsweredAllQuestions()) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
        message: 'Player already answered to all questions',
      });
    }
    const questions = game.questions as GameQuestion[];
    const gameQuestion = questions[currentPlayer.getIndexAnswerQuestion()];

    const newAnswer = Answer.createAnswer({
      questionId: gameQuestion.questionId,
      playerId: currentPlayer.id,
      status: gameQuestion.question.answers.includes(
        command.answer.trim().toLowerCase(),
      )
        ? AnswerStatusesEnum.correct
        : AnswerStatusesEnum.incorrect,
    });
    await this.answerRepository.save(newAnswer);
    currentPlayer.addAnswerQuestion(newAnswer);

    game.tryToFinish();

    await this.playerRepository.save(currentPlayer);
    await this.playerRepository.save(opponentPlayer);

    await this.gameRepository.save(game);

    return AnswerViewDto.mapToView(newAnswer);
  }
}
