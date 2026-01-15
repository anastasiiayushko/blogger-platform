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

    return await repo.findOne({ where: { userId: userId } });
    // if (!statistic) {
    //   return GameStatistic.createStatistic(userId);
    // }
  }

  async save(gameStatistic: GameStatistic, em?: EntityManager): Promise<void> {
    const repo = this.getRepository(em);
    await repo.save(gameStatistic);
  }
}
