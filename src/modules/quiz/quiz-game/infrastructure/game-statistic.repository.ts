import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { GameStatistic } from '../domain/game-statistic/game-statistic.entity';

@Injectable()
export class GameStatisticRepository {
  constructor(
    @InjectRepository(GameStatistic)
    private readonly statisticRepository: Repository<GameStatistic>,
  ) {}

  private getRepository(em?: EntityManager): Repository<GameStatistic> {
    return em ? em.getRepository(GameStatistic) : this.statisticRepository;
  }

  async findByUserId(
    userId: string,
    em?: EntityManager,
  ): Promise<GameStatistic | null> {
    const repo = this.getRepository(em);

    return await repo.findOne({
      where: { userId: userId },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async setStatistic(
    statistic: {
      userId: string;
      score: number;
      winsCount: number;
      lossesCount: number;
      drawsCount: number;
    },
    em: EntityManager,
  ): Promise<any> {
    const result = await em
      .createQueryBuilder()
      .update(GameStatistic)
      .set({
        sumScore: () => 'sum_score + :score',
        gameCount: () => 'game_count + 1',
        avgScore: () =>
          'round((sum_score + :score)::numeric / (game_count + 1), 2)',
        winsCount: () => 'wins_count + :win',
        lossesCount: () => 'losses_count + :loss',
        drawsCount: () => 'draws_count + :draw',
      })
      .where('user_id = :id', { id: statistic.userId })
      .setParameters({
        score: statistic.score,
        win: statistic.winsCount,
        loss: statistic.lossesCount,
        draw: statistic.drawsCount,
      })
      .execute();

    return result;
  }

  async save(gameStatistic: GameStatistic, em?: EntityManager): Promise<void> {
    const repo = this.getRepository(em);
    await repo.save(gameStatistic);
  }
  /**
   *  безопасность при гонке. Если два потока
   *   одновременно пытаются создать запись, обычный save
   *   даст ошибку по уникальному индексу, а INSERT ... ON
   *   CONFLICT DO NOTHING просто проигнорирует второй insert
   *   без ошибки. Это атомарно на стороне БД и дешевле, чем
   *   ловить исключение и повторять чтение.
   *
   * */
  async createIfNotExists(
    userId: string,
    em: EntityManager,
  ): Promise<void> {
    const repo = this.getRepository(em);
    await repo
      .createQueryBuilder()
      .insert()
      .into(GameStatistic)
      .values(GameStatistic.createStatistic(userId))
      .orIgnore()
      .execute();
  }
}
