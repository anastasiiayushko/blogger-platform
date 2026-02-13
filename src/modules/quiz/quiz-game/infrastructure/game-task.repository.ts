import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager, In } from 'typeorm';
import { GameTask } from '../domain/game-task/game-task.entity';
import { GameTaskStatuses } from '../domain/game-task/game-task.statuses.enum';

@Injectable()
export class GameTaskRepository {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async createTask(gameTask: GameTask, em: EntityManager): Promise<string> {
    const task = await em
      .createQueryBuilder()
      .insert()
      .into(GameTask)
      .values({
        gameId: gameTask.gameId,
        status: gameTask.status,
        executeAt: () => "Now() + INTERVAL '3 seconds'",
      })
      .returning('id')
      .execute();
    console.log('task', task);
    return task.raw.id;
  }

  async getExecutedTasks(
    em: EntityManager,
  ): Promise<{ id: string; gameId: string }[] | null> {
    const tasks = await em
      .createQueryBuilder()
      .select('game_task.id', 'id')
      .from(GameTask, 'game_task')
      // .setLock('pessimistic_write')
      .setOnLocked('skip_locked')
      .where(
        'game_task.executeAt <= NOW() AND game_task.status = :statusPending',
      )
      .orWhere(
        `game_task.lockedUntil <= NOW() AND game_task.status = :statusProcessing`,
      )
      .setParameters({
        statusPending: GameTaskStatuses.PENDING,
        statusProcessing: GameTaskStatuses.PROCESSING,
      })
      .orderBy('game_task.executeAt', 'ASC')
      .addOrderBy('game_task.lockedUntil', 'ASC')
      .limit(10)
      .getRawMany<{ id: string }>();

    const taskIds = tasks.map((i) => i.id);
    if (!taskIds.length) return null;
    const updated = await em
      .createQueryBuilder()
      .update(GameTask)
      .set({
        status: GameTaskStatuses.PROCESSING,
        lockedUntil: () => "NOW() + INTERVAL '30 seconds'",
      })
      // Підставляємо SQL підзапиту в IN
      .where(`id IN (:...ids)`, { ids: taskIds })
      .returning(['id', 'gameId'])
      .execute();

    return updated.raw;
    // return await em
    //   .getRepository(GameTask)
    //   .createQueryBuilder('game_task')
    //   .where(`id IN(:...ids)`, { ids: taskIds })
    //   .getMany();
  }
}
