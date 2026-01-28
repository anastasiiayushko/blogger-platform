import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { GameStatistic } from '../../domain/game-statistic/game-statistic.entity';
import { GameStatisticViewDto } from './mapper/game-statistic.view-dto';
import {
  UsersTopSortByEnum,
  UsersTopQueryParamsDto,
} from '../../features/pair-game/api/input-dto/users-top-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { MyGameSortByEnum } from '../../features/pair-game/api/input-dto/my-games-query-params.input-dto';
import { UsersTopViewDto } from './mapper/users-top.view-dto';

@Injectable()
export class GameStatisticQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findStatisticByUserId(usesId: string): Promise<GameStatisticViewDto> {
    const statistic = await this.dataSource
      .getRepository(GameStatistic)
      .findOne({ where: { userId: usesId } });
    return GameStatisticViewDto.mapToView(statistic);
  }

  async getUsersTop(
    queryParamsDto: UsersTopQueryParamsDto,
  ): Promise<PaginatedViewDto<UsersTopViewDto[]>> {
    const QUERY_MAP: Record<UsersTopSortByEnum, string> = {
      [UsersTopSortByEnum.sumScore]: 'sum_score',
      [UsersTopSortByEnum.drawsCount]: 'draws_count',
      [UsersTopSortByEnum.lossesCount]: 'losses_count',
      [UsersTopSortByEnum.winsCount]: 'wins_Count',
      [UsersTopSortByEnum.gameCount]: 'game_count',
      [UsersTopSortByEnum.avgScore]: 'avg_score',
    };
    const [firstSortBy = null, ...otherSortBy] = queryParamsDto.sort;

    const statisticQb = this.dataSource
      .getRepository(GameStatistic)
      .createQueryBuilder('static')
      .select(['static', 'user.id', 'user.login'])
      .leftJoin('static.user', 'user');

    if (firstSortBy) {
      const column = QUERY_MAP[firstSortBy.field];
      statisticQb.orderBy({
        [column]: firstSortBy.direction,
      });
    }
    if (otherSortBy.length) {
      otherSortBy.forEach((sortBy) => {
        const column = QUERY_MAP[sortBy.field];
        statisticQb.addOrderBy(column, sortBy.direction);
      });
    }
    console.log(statisticQb.getSql());
    const [result, totalCount] = await statisticQb.getManyAndCount();
    const staticOutput = result.map((row) => UsersTopViewDto.mapToView(row));
    return PaginatedViewDto.mapToView({
      totalCount,
      size: queryParamsDto.pageSize,
      page: queryParamsDto.pageNumber,
      items: staticOutput,
    });
  }
}
