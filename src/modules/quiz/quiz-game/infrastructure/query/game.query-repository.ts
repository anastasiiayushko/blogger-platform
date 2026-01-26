import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { Game } from '../../domain/game/game.entity';
import { GameStatusesEnum } from '../../domain/game/game-statuses.enum';
import { GamePairViewDto } from './mapper/game-pair.view-dto';
import {
  MyGameSortByEnum,
  MyGamesQueryDto,
} from '../../features/pair-game/api/input-dto/my-games-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { toTypeOrmOrderDir } from '../../../../../core/utils/sort/to-type-orm-order-dir';

@Injectable()
export class GameQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private baseGameQueryBuilder(): SelectQueryBuilder<Game> {
    return this.dataSource
      .getRepository(Game)
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.firstPlayer', 'p1')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p1.answers', 'a1')

      .leftJoinAndSelect('game.secondPlayer', 'p2')
      .leftJoinAndSelect('p2.user', 'u2')
      .leftJoinAndSelect('p2.answers', 'a2')
      .leftJoinAndSelect('game.questions', 'gq', 'gq.game_id = game.id')
      .leftJoinAndSelect('gq.question', 'q');
  }

  async findUnfinishedGameByUserId(
    userId: string,
  ): Promise<GamePairViewDto | null> {
    const game = await this.baseGameQueryBuilder()
      .where('(p1.user_id =:userId or p2.user_id =:userId)', {
        userId,
      })
      .andWhere('game.status In(:...statuses) ', {
        statuses: [GameStatusesEnum.pending, GameStatusesEnum.active],
      })
      .orderBy('game.createdAt', 'DESC')
      .addOrderBy('gq.order', 'ASC')
      .addOrderBy('a1.createdAt', 'ASC')
      .addOrderBy('a2.createdAt', 'ASC')
      .getOne();

    if (!game) {
      return null;
    }
    return GamePairViewDto.mapToView(game);
  }

  async findGameById(id: string): Promise<GamePairViewDto | null> {
    const game = await this.baseGameQueryBuilder()
      .where('game.id = :id', {
        id,
      })
      .orderBy('gq.order', 'ASC')
      .addOrderBy('a1.createdAt', 'ASC')
      .addOrderBy('a2.createdAt', 'ASC')
      .getOne();

    if (!game) {
      return null;
    }
    return GamePairViewDto.mapToView(game);
  }

  async myGames(
    userId: string,
    query: MyGamesQueryDto,
  ): Promise<PaginatedViewDto<GamePairViewDto[]>> {
    type SortByValue = (typeof MyGameSortByEnum)[keyof typeof MyGameSortByEnum];

    const QUERY_MAP: Record<SortByValue, string> = {
      [MyGameSortByEnum.pairCreatedDate]: 'createdAt',
      [MyGameSortByEnum.startGameDate]: 'startGameDate',
      [MyGameSortByEnum.finishGameDate]: 'finishGameDate',
    };
    const sortBy = QUERY_MAP[query.sortBy];
    const sortDirection = toTypeOrmOrderDir(query.sortDirection);

    const [gamesForPage, totalCount] = await
      this.dataSource
        .getRepository(Game)
        .createQueryBuilder('game')
        .leftJoin('game.firstPlayer', 'p1')
        .leftJoin('game.secondPlayer', 'p2')
        .where('p1.userId = :userId OR p2.userId = :userId', { userId })
        .select('game.id', 'game_id')
        .addSelect(`game.${sortBy}`, 'game_sort')
        .addSelect('game.createdAt', 'game_created_at')
        .orderBy('game_sort', sortDirection)
        .addOrderBy('game_created_at', 'DESC')
        .skip(query.calculateSkip())
        .take(query.pageSize)
        .getManyAndCount();

    const ids = gamesForPage.map((game) => game.id);
    if (!ids.length) {
      return PaginatedViewDto.mapToView({
        totalCount,
        page: query.pageNumber,
        size: query.pageSize,
        items: [],
      });
    }

    const games = await this.baseGameQueryBuilder()
      .where('game.id IN (:...ids)', { ids })
      .orderBy(`game.${sortBy}`, sortDirection)
      .addOrderBy('game.createdAt', 'DESC')
      .addOrderBy('gq.order', 'ASC')
      .addOrderBy('a1.createdAt', 'ASC')
      .addOrderBy('a2.createdAt', 'ASC')
      .getMany();

    return PaginatedViewDto.mapToView({
      totalCount,
      page: query.pageNumber,
      size: query.pageSize,
      items: games.map((i) => GamePairViewDto.mapToView(i)),
    });
  }
}
