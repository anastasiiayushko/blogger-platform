import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GameStatistic } from '../../domain/game-statistic/game-statistic.entity';
import { GameStatisticViewDto } from './mapper/game-statistic.view-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { TopPlayersViewDto } from './mapper/top-players.view-dto';
import {
  TopPlayersQueryParamsDto,
  TopPlayersSortByEnum,
} from '../../features/pair-game/api/input-dto/top-players-query-params.input-dto';

@Injectable()
export class GameStatisticQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findStatisticByUserId(usesId: string): Promise<GameStatisticViewDto> {
    const statistic = await this.dataSource
      .getRepository(GameStatistic)
      .findOne({ where: { userId: usesId } });
    return GameStatisticViewDto.mapToView(statistic);
  }

  async getTopPlayers(
    queryParamsDto: TopPlayersQueryParamsDto,
  ): Promise<PaginatedViewDto<TopPlayersViewDto[]>> {
    const QUERY_MAP: Record<TopPlayersSortByEnum, string> = {
      [TopPlayersSortByEnum.sumScore]: 'sumScore',
      [TopPlayersSortByEnum.drawsCount]: 'drawsCount',
      [TopPlayersSortByEnum.lossesCount]: 'lossesCount',
      [TopPlayersSortByEnum.winsCount]: 'winsCount',
      [TopPlayersSortByEnum.gameCount]: 'gameCount',
      [TopPlayersSortByEnum.avgScore]: 'avgScore',
    };
    const [firstSortBy = null, ...otherSortBy] = queryParamsDto.sort;

    const statisticQb = this.dataSource
      .getRepository(GameStatistic)
      .createQueryBuilder('static')
      .select(['static', 'user.id', 'user.login'])
      .leftJoin('static.user', 'user');
    if (firstSortBy) {
      const column = QUERY_MAP[firstSortBy.field];
      statisticQb.orderBy(`static.${column}`, firstSortBy.direction);
    }
    if (otherSortBy.length) {
      otherSortBy.forEach((sortBy) => {
        const column = QUERY_MAP[sortBy.field];
        statisticQb.addOrderBy(`static.${column}`, sortBy.direction);
      });
    }

    const [result, totalCount] = await statisticQb
      .skip((+queryParamsDto.pageNumber - 1) * queryParamsDto.pageSize)
      .take(queryParamsDto.pageSize)
      .getManyAndCount();

    const staticOutput = result.map((row) => TopPlayersViewDto.mapToView(row));
    return PaginatedViewDto.mapToView({
      totalCount,
      size: queryParamsDto.pageSize,
      page: queryParamsDto.pageNumber,
      items: staticOutput,
    });
  }
}
