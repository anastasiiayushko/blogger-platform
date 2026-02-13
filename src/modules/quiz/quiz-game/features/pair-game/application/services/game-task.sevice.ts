import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameTaskRepository } from '../../../../infrastructure/game-task.repository';
import { DataSource } from 'typeorm';
import { GameStatusesEnum } from '../../../../domain/game/game-statuses.enum';
import { GameTask } from '../../../../domain/game-task/game-task.entity';
import { GameTaskStatuses } from '../../../../domain/game-task/game-task.statuses.enum';
import { Answer } from '../../../../domain/answer/answer.entity';
import { Game } from '../../../../domain/game/game.entity';
import { Player } from '../../../../domain/player/player.entity';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { GameStatisticService } from './game-statistic.service';

@Injectable()
export class GameTaskService {
  constructor(
    protected gameTaskRepository: GameTaskRepository,
    protected playerRepository: PlayerRepository,
    protected gameStatisticService: GameStatisticService,
    protected dataSource: DataSource,
  ) {}

  @Cron('*/10 * * * * *', {
    name: 'GameTask',
  })
  async handleCron() {
    try {
      await this.dataSource.transaction(async (trx) => {
        const tasks = await this.gameTaskRepository.getExecutedTasks(trx);

        if (!tasks) return;

        for (const task of tasks) {
          try {
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
                await this.playerRepository.updatePlayerProgress(
                  game.firstPlayer,
                  subTrx,
                );
                await this.playerRepository.updatePlayerProgress(
                  game!.secondPlayer as Player,
                  subTrx,
                );

                await subTrx
                  .createQueryBuilder()
                  .update(Game)
                  .set({
                    status: GameStatusesEnum.finished,
                    finishGameDate: () => 'NOW()',
                  })
                  .where(
                    `status = :statusActive and id = :idGame and version = :version`,
                    {
                      statusActive: GameStatusesEnum.active,
                      idGame: game.id,
                      version: game.version,
                    },
                  )
                  .execute();
                await this.gameStatisticService.recalculateAndSaveGameStatistic(game, subTrx)

                return okTrx;

                // await this.gameRepository.save(game, em);

                // await subTrx
                //   .createQueryBuilder()
                //   .update(Player)
                //   .set({
                //     score: game.firstPlayer.score,
                //     result: game.firstPlayer.result,
                //     gameStatus: game.firstPlayer.gameStatus,
                //   })
                //   .where(
                //     `id = :idPlayer and version = :version and result Is Null`,
                //     {
                //       id: game.firstPlayer.id,
                //       version: game.firstPlayer.version,
                //     },
                //   )
                //   .execute();
                //
                // await subTrx
                //   .createQueryBuilder()
                //   .update(Player)
                //   .set({
                //     score: game.secondPlayer!.score,
                //     result: game.secondPlayer!.result,
                //     gameStatus: game.secondPlayer!.gameStatus,
                //   })
                //   .where(
                //     `id = :idPlayer and version = :version and result Is Null`,
                //     {
                //       id: game.secondPlayer!.id,
                //       version: game.secondPlayer!.version,
                //     },
                //   )
                //   .execute();

                // return okTrx;
              },
            );

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
