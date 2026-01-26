import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamePairViewDto } from '../../../../infrastructure/query/mapper/game-pair.view-dto';
import { GameQueryRepository } from '../../../../infrastructure/query/game.query-repository';
import { MyGamesQueryDto } from '../../api/input-dto/my-games-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../../../core/dto/base.paginated.view-dto';

export class MyGamesQuery extends Query<PaginatedViewDto<GamePairViewDto[]>> {
  constructor(
    public userId: string,
    public query: MyGamesQueryDto,
  ) {
    super();
  }
}

@QueryHandler(MyGamesQuery)
export class MyGamesHandler implements IQueryHandler<MyGamesQuery> {
  constructor(protected gameQueryRepository: GameQueryRepository) {}

  async execute({ userId, query }: MyGamesQuery) {
    return await this.gameQueryRepository.myGames(userId, query);
  }
}
