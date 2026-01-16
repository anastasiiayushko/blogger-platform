import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GameStatisticViewDto } from '../../../../infrastructure/query/mapper/game-statistic.view-dto';

export const UsersStatisticGameDocDecorator = () => {
  return applyDecorators(
    ApiOperation({
      summary: `Get current user statistic`,
    }),
    ApiBearerAuth(),
    ApiOkResponse({ type: GameStatisticViewDto }),

    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
};
