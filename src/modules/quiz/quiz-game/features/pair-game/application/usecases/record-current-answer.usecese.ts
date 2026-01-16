import { ValidatableCommand } from '../../../../../../../core/validate/validatable-command';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { GameRepository } from '../../../../infrastructure/game.repository';
import { DomainException } from '../../../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../../../core/exceptions/domain-exception-codes';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { AnswerRepository } from '../../../../infrastructure/answer.repository';
import { Answer } from '../../../../domain/answer/answer.entity';
import { AnswerStatusesEnum } from '../../../../domain/answer/answer-statuses.enum';
import { AnswerViewDto } from '../../api/view-dto/answer.view-dto';
import { GameQuestion } from '../../../../domain/game-question/game-question.entity';
import { DataSource } from 'typeorm';
import { GameStatisticService } from '../services/game-statistic.service';

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

//::TODO T1 - T2 почти в один момент выполняются Т1 - захватил игру Т2 - прочитала но ожидает commit T1
// в результате игра для T2 не консистента

@CommandHandler(RecordCurrentAnswerCommand)
export class RecordCurrentAnswerHandler
  implements ICommandHandler<RecordCurrentAnswerCommand>
{
  constructor(
    protected gameRepository: GameRepository,
    protected playerRepository: PlayerRepository,
    protected answerRepository: AnswerRepository,
    protected applyGameStatisticService: GameStatisticService,
    protected dataSource: DataSource,
  ) {}

  async execute(command: RecordCurrentAnswerCommand): Promise<AnswerViewDto> {
    await command.validateOrFail();
    const answerViewDto = await this.dataSource.transaction(async (em) => {
      try {
        const game = await this.gameRepository.findActiveGameByUserId(
          command.userId,
          em,
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

        const { currentPlayer, opponentPlayer } = game.getPlayersByUserId(
          command.userId,
        );

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

        await this.answerRepository.save(newAnswer, em);
        currentPlayer.addAnswerQuestion(newAnswer);

        game.tryToFinish();

        await this.playerRepository.updatePlayerProgress(currentPlayer, em);
        await this.playerRepository.updatePlayerProgress(opponentPlayer, em);
        await this.gameRepository.save(game, em);

        await this.applyGameStatisticService.recalculateAndSaveGameStatistic(
          game,
          em,
        );

        return AnswerViewDto.mapToView(newAnswer);
      } catch (err) {
        if (err?.code === '55P03') {
          // lock_not_available
        }

        console.error(err);
        throw err;
      }
    });
    return answerViewDto;
  }
}
