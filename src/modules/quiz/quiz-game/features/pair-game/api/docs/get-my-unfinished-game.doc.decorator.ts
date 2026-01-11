import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GamePairViewDto } from '../../../../infrastructure/query/mapper/game-pair.view-dto';

export const GetMyUnfinishedGameDocDecorator = () => {
  return applyDecorators(
    ApiOperation({
      summary: `Returns current unfinished game user`,
    }),
    ApiBearerAuth(),
    ApiOkResponse({ type: GamePairViewDto }),
    ApiNotFoundResponse({
      description: 'If no active pair for current user',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
};
