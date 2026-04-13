import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameTaskRepository } from '../../../../infrastructure/game-task.repository';
import { DataSource, LockNotSupportedOnGivenDriverError } from 'typeorm';
import { GameStatusesEnum } from '../../../../domain/game/game-statuses.enum';
import { GameTask } from '../../../../domain/game-task/game-task.entity';
import { GameTaskStatuses } from '../../../../domain/game-task/game-task.statuses.enum';
import { Answer } from '../../../../domain/answer/answer.entity';
import { Game } from '../../../../domain/game/game.entity';
import { Player } from '../../../../domain/player/player.entity';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { GameStatisticService } from './game-statistic.service';
import { log } from 'node:util';

@Injectable()
export class GameTaskService {
  constructor(
    protected gameTaskRepository: GameTaskRepository,
    protected playerRepository: PlayerRepository,
    protected gameStatisticService: GameStatisticService,
    protected dataSource: DataSource,
  ) {}

  @Cron('*/1 * * * * *', {
    name: 'GameTask',
  })
  async handleCron() {
    try {
      await this.dataSource.transaction(async (trx) => {
        const tasks = await this.gameTaskRepository.getExecutedTasks(trx);

        if (!tasks) return;
        console.log('ALL tasks:', tasks);

        for (const task of tasks) {
          try {
            console.log('ONE task:', task);
            const resultCancelGame = await this.dataSource.transaction(
              async (subTrx) => {
                const okTrx = true;

                const game = await subTrx.getRepository(Game).findOne({
                  where: { id: task.gameId },
                  relations: {
                    firstPlayer: { answers: true },
                    secondPlayer: { answers: true },
                    questions: true,
                  },
                  lock: {
                    mode: 'pessimistic_write',
                    tables: ['game'],
                  },
                });

                if (!game) {
                  console.log(`Game not found. Task[gameId] ->`, task.gameId);
                  return false;
                }

                if (game.status === GameStatusesEnum.finished) {
                  console.log(`The game is over`, game);
                  return okTrx;
                }

                const missingAnswers = game.createMissingAnswersForPlayer();
                if (missingAnswers.length > 0) {
                  await subTrx
                    .createQueryBuilder()
                    .insert()
                    .into(Answer)
                    .values(missingAnswers)
                    .orIgnore('("playerId", "questionId")')
                    .execute();
                }

                const isFinished = game.tryToFinish();

                if (!isFinished) {
                  console.log(
                    `attempt to finish the game failed. Game -> `,
                    game,
                  );
                  return false;
                }

                const gameUpdateResult = await subTrx
                  .createQueryBuilder()
                  .update(Game)
                  .set({
                    status: GameStatusesEnum.finished,
                    finishGameDate: () => 'NOW()',
                  })
                  .where(
                    `status = :statusActive and finishGameDate IS NULL and id = :idGame`,
                    {
                      statusActive: GameStatusesEnum.active,
                      idGame: game.id,
                    },
                  )
                  .execute();
                console.log('game updated result ->', gameUpdateResult);
                if (gameUpdateResult.affected !== 1) {
                  return false;
                }
                await this.playerRepository.updatePlayerProgress(
                  game.firstPlayer,
                  subTrx,
                );
                await this.playerRepository.updatePlayerProgress(
                  game!.secondPlayer as Player,
                  subTrx,
                );
                await this.gameStatisticService.recalculateAndSaveGameStatistic(
                  game,
                  subTrx,
                );

                return okTrx;
              },
            );

            console.log('result canceled ->', resultCancelGame);

            await trx
              .createQueryBuilder()
              .update(GameTask)
              .set({
                status: resultCancelGame
                  ? GameTaskStatuses.DONE
                  : GameTaskStatuses.FAILED,
                lockedUntil: null,
              })
              .where('id = :id', { id: task.id })
              .execute();
          } catch (e) {
            console.error('Some error in closed game:', e.message, e.stack);
          }
        }
      });
    } catch (e) {
      console.error(
        'Some error in closed game with game_task:',
        e.message,
        e.stack,
      );
    }
  }
}
