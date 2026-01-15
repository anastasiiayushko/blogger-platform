import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GameStatistic } from '../../domain/game-statistic/game-statistic.entity';

@Injectable()
export class GameStatisticQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findStatisticByUserId(usesId: string): Promise<any> {
    const statistic = await this.dataSource
      .getRepository(GameStatistic)
      .findOne({ where: { userId: usesId } });
  }
}
