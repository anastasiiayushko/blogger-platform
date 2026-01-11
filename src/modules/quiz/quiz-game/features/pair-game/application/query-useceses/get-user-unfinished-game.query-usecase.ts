import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { GamePairViewDto } from '../../../../infrastructure/query/mapper/game-pair.view-dto';
import { GameQueryRepository } from '../../../../infrastructure/query/game.query-repository';
import { DomainException } from '../../../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../../../core/exceptions/domain-exception-codes';

export class GetUserUnfinishedGameQuery extends Query<GamePairViewDto> {
  constructor(public userId: string) {
    super();
  }
}

@QueryHandler(GetUserUnfinishedGameQuery)
export class GetUserUnfinishedGameQueryHandler
  implements IQueryHandler<GetUserUnfinishedGameQuery>
{
  constructor(protected gameQueryRepository: GameQueryRepository) {}

  async execute(query: GetUserUnfinishedGameQuery) {
    const game = await this.gameQueryRepository.findUnfinishedGameByUserId(
      query.userId,
    );
    if (!game) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    return game;
  }
}
