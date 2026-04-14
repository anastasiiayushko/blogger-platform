import { Injectable } from '@nestjs/common';
import { GameTaskRepository } from '../../../../infrastructure/game-task.repository';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { GameStatisticService } from './game-statistic.service';
import { EntityManager } from 'typeorm';
import { Game } from '../../../../domain/game/game.entity';
import { Player } from '../../../../domain/player/player.entity';
import { GameQuestion } from '../../../../domain/game-question/game-question.entity';
import { Answer } from '../../../../domain/answer/answer.entity';
import { GameStatusesEnum } from '../../../../domain/game/game-statuses.enum';
import { AnswerStatusesEnum } from '../../../../domain/answer/answer-statuses.enum';

export type FinalizeResult = 'done' | 'retry';

@Injectable()
export class FinalizedGameService {
  constructor(
    protected playerRepository: PlayerRepository,
    protected gameStatisticService: GameStatisticService,
  ) {}

  async finalizeByGameId(
    gameId: string,
    trx: EntityManager,
  ): Promise<FinalizeResult> {
    // 1) lock only game row (без relations, чтобы не ловить outer join + FOR UPDATE)
    const lockedGame = await trx.getRepository(Game).findOne({
      where: { id: gameId },
      lock: { mode: 'pessimistic_write' },
    });

    if (!lockedGame) {
      return 'retry';
    }

    // 2) если уже завершена — идемпотентный успех
    if (
      lockedGame.status === GameStatusesEnum.finished &&
      lockedGame.finishGameDate
    ) {
      return 'done';
    }

    // 3) загрузить нужные relations отдельным запросом
    const game = (await trx.getRepository(Game).findOne({
      where: { id: gameId },
      relations: {
        questions: true,
        firstPlayer: { answers: true },
        secondPlayer: { answers: true },
      },
    })) as Game | null;

    if (!game || !game.firstPlayerId || !game.secondPlayerId) {
      return 'retry';
    }

    const gameQuestions = game.questions as GameQuestion[];

    const autoAnswerFirstPlayer = gameQuestions.map((question) =>
      Answer.createAnswer({
        questionId: question.questionId,
        status: AnswerStatusesEnum.incorrect,
        playerId: game.firstPlayerId,
      }),
    );

    const autoAnswerSecondPlayer = gameQuestions.map((question) =>
      Answer.createAnswer({
        questionId: question.questionId,
        status: AnswerStatusesEnum.incorrect,
        playerId: game.secondPlayerId!,
      }),
    );

    const missingAnswers = [
      ...autoAnswerFirstPlayer,
      ...autoAnswerSecondPlayer,
    ];

    if (missingAnswers.length > 0) {
      await trx
        .createQueryBuilder()
        .insert()
        .into(Answer)
        .values(missingAnswers)
        .orIgnore('("playerId", "questionId")')
        .execute();
    }

    // 4) атомарно переводим в finished только из active
    const updateGameResult = await trx
      .createQueryBuilder()
      .update(Game)
      .set({
        status: GameStatusesEnum.finished,
        finishGameDate: () => 'NOW()',
      })
      .where('id = :idGame', { idGame: game.id })
      .andWhere('status = :activeStatus AND finishGameDate IS NULL', {
        activeStatus: GameStatusesEnum.active,
      })

      .execute();

    if (updateGameResult.affected !== 1) {
      const alreadyFinished = await trx.query(
        `SELECT 1 FROM game WHERE id = $1 AND status = $2 AND "finishGameDate" IS NOT NULL`,
        [game.id, GameStatusesEnum.finished],
      );

      if (alreadyFinished.length > 0) {
        return 'done';
      }

      return 'retry';
    }

    // 5) перечитываем актуальную игру и применяем доменную логику (score/bonus)
    const gameFinished = (await trx.getRepository(Game).findOne({
      where: { id: gameId },
      relations: {
        firstPlayer: { answers: true },
        secondPlayer: { answers: true },
        questions: true,
      },
    })) as Game | null;

    if (!gameFinished?.firstPlayer || !gameFinished.secondPlayer) {
      return 'retry';
    }

    gameFinished.autoFinalizedGame();

    await this.playerRepository.updatePlayerProgress(
      gameFinished.firstPlayer,
      trx,
    );
    await this.playerRepository.updatePlayerProgress(
      gameFinished.secondPlayer as Player,
      trx,
    );
    await this.gameStatisticService.recalculateAndSaveGameStatistic(
      gameFinished,
      trx,
    );

    return 'done';
  }
}
