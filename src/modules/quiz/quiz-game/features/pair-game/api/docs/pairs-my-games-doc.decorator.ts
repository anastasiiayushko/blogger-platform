import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GameStatisticViewDto } from '../../../../infrastructure/query/mapper/game-statistic.view-dto';
import { PaginatedViewDto } from '../../../../../../../core/dto/base.paginated.view-dto';

export const PairsMyGamesDocDecorator = () => {
  return applyDecorators(
    ApiOperation({
      summary: `Returns all my games (closed games and current)`,
    }),
    ApiBearerAuth(),
    ApiOkResponse({ type: PaginatedViewDto<GameStatisticViewDto[]> }),

    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
};
