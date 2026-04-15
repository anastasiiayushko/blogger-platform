import { Injectable } from '@nestjs/common';
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
      relations: {
        questions: true,
        firstPlayer: { answers: true },
        secondPlayer: { answers: true },
      },
      lock: { mode: 'pessimistic_write', tables: ['game'] },
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



    lockedGame.autoFinalizedGame();



    await trx.getRepository(Game).save(lockedGame);

    await this.playerRepository.updatePlayerProgress(
      lockedGame.firstPlayer,
      trx,
    );
    await this.playerRepository.updatePlayerProgress(
      lockedGame.secondPlayer as Player,
      trx,
    );
    // await this.gameStatisticService.recalculateAndSaveGameStatistic(
    //   lockedGame,
    //   trx,
    // );

    return 'done';
  }
}
