import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamePairViewDto } from '../../../../infrastructure/query/mapper/game-pair.view-dto';
import { GameQueryRepository } from '../../../../infrastructure/query/game.query-repository';
import { DomainException } from '../../../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../../../core/exceptions/domain-exception-codes';

export class GetGameByIdQuery extends Query<GamePairViewDto> {
  constructor(
    public userId: string,
    public gameId: string,
  ) {
    super();
  }
}

@QueryHandler(GetGameByIdQuery)
export class GetGameByIdHandler
  implements IQueryHandler<GetGameByIdQuery>
{
  constructor(protected gameQueryRepository: GameQueryRepository) {}

  async execute(query: GetGameByIdQuery) {
    const game = await this.gameQueryRepository.findGameById(query.gameId);

    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    const playerIds = [
      game.firstPlayerProgress.player.id,
      game?.secondPlayerProgress?.player.id ?? '-',
    ];
    if (!playerIds.includes(query.userId)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }
    return game;
  }
}
