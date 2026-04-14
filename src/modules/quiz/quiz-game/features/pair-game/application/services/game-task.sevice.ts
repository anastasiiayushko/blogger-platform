import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { GameTaskRepository } from '../../../../infrastructure/game-task.repository';
import {
  DataSource,
  IsNull,
  LockNotSupportedOnGivenDriverError,
  Not,
} from 'typeorm';
import { GameStatusesEnum } from '../../../../domain/game/game-statuses.enum';
import { GameTask } from '../../../../domain/game-task/game-task.entity';
import { GameTaskStatuses } from '../../../../domain/game-task/game-task.statuses.enum';
import { Answer } from '../../../../domain/answer/answer.entity';
import { Game } from '../../../../domain/game/game.entity';
import { Player } from '../../../../domain/player/player.entity';
import { PlayerRepository } from '../../../../infrastructure/player.repository';
import { GameStatisticService } from './game-statistic.service';
import { GameQuestion } from '../../../../domain/game-question/game-question.entity';
import { FinalizedGameService } from './finalized-game.service';

@Injectable()
export class GameTaskService {
  constructor(
    protected gameTaskRepository: GameTaskRepository,
    protected playerRepository: PlayerRepository,
    protected gameStatisticService: GameStatisticService,
    protected dataSource: DataSource,
    protected finalizedGameService: FinalizedGameService,
  ) {}

  @Cron('*/1 * * * * *', {
    name: 'GameTask',
  })
  async handleCron() {
    // const queryRunner = this.dataSource.createQueryRunner();
    //
    // // establish real database connection using our new query runner
    // await queryRunner.connect();
    //
    //
    // await queryRunner.startTransaction();
    try {
      await this.dataSource
        .transaction(async (trx) => {
          const tasks = await this.gameTaskRepository.getExecutedTasks(trx);

          if (!tasks) return;

          for (const task of tasks) {
              console.log('ONE task:', task);

              const result = await this.finalizedGameService.finalizeByGameId(
                task.gameId,
                trx,
              );
              if (result === 'done') {
                await trx
                  .createQueryBuilder()
                  .update(GameTask)
                  .set({
                    status: GameTaskStatuses.DONE,
                    lockedUntil: null,
                  })
                  .where('id = :id', { id: task.id })
                  .execute();
              }

              if (result === 'retry') {
                await trx
                  .createQueryBuilder()
                  .update(GameTask)
                  .set({
                    status: GameTaskStatuses.PENDING,
                    executeAt: "NOW() + INTERVAL '8 seconds'",
                    lockedUntil: null,
                  })
                  .where('id = :id', { id: task.id })
                  .execute();
              }


          }
          console.log('ALL tasks:', tasks);
        })

    } catch (e) {
      console.error(
        'Some error in closed game with game_task:',
        e.message,
        e.stack,
      );
    }
  }
}

// for (const task of tasks) {
//   try {
//     console.log('ONE task:', task);
//     const resultCancelGame = await this.dataSource.transaction(
//       async (subTrx) => {
//         const okTrx = true;
//
//         const game = await subTrx.getRepository(Game).findOne({
//           where: { id: task.gameId },
//           relations: {
//             firstPlayer: { answers: true },
//             secondPlayer: { answers: true },
//             questions: true,
//           },
//           lock: {
//             mode: 'pessimistic_write',
//             tables: ['game'],
//           },
//         });
//
//         if (!game) {
//           console.log(`Game not found. Task[gameId] ->`, task.gameId);
//           return false;
//         }
//
//         // if (game.status === GameStatusesEnum.finished) {
//         //   console.log(`The game is over`, game);
//         //   return okTrx;
//         // }
//
//         const missingAnswers = game.createMissingAnswersForPlayer();
//         if (missingAnswers.length > 0) {
//           await subTrx
//             .createQueryBuilder()
//             .insert()
//             .into(Answer)
//             .values(missingAnswers)
//             .orIgnore('("playerId", "questionId")')
//             .execute();
//         }
//
//         const isFinished = game.tryToFinish();
//         console.log('TRY TO FINISH GAME:', isFinished);
//
//         if (!isFinished) {
//           console.log(`attempt to finish the game failed. Game -> `, game);
//           return false;
//         }
//
//         console.log('game.status', game.status);
//
//         const gameUpdateResult = await subTrx
//           .createQueryBuilder()
//           .update(Game)
//           .set({
//             status: GameStatusesEnum.finished,
//             finishGameDate: () => 'NOW()',
//           })
//           .where(`finishGameDate IS NULL and id = :idGame`, {
//             idGame: game.id,
//           })
//           .execute();
//         console.log('game updated result ->', gameUpdateResult);
//         if (gameUpdateResult.affected !== 1) {
//           return false;
//         }
//         await this.playerRepository.updatePlayerProgress(
//           game.firstPlayer,
//           subTrx,
//         );
//         await this.playerRepository.updatePlayerProgress(
//           game!.secondPlayer as Player,
//           subTrx,
//         );
//         await this.gameStatisticService.recalculateAndSaveGameStatistic(
//           game,
//           subTrx,
//         );
//
//         return okTrx;
//       },
//     );
//
//     console.log('result canceled ->', resultCancelGame);
//
//     await trx
//       .createQueryBuilder()
//       .update(GameTask)
//       .set({
//         status: resultCancelGame
//           ? GameTaskStatuses.DONE
//           : GameTaskStatuses.FAILED,
//         lockedUntil: null,
//       })
//       .where('id = :id', { id: task.id })
//       .execute();
//   } catch (e) {
//     console.error('Some error in closed game:', e.message, e.stack);
//   }
// }