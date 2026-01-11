import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GamePairViewDto } from '../../../../infrastructure/query/mapper/game-pair.view-dto';

export const GamePairConnectionDocDecorator = () => {
  return applyDecorators(
    ApiOperation({
      summary: `Connect current user to existing random pending pair or create new pair which will be waiting second player`,
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      type: GamePairViewDto,
      description: `
Returns started existing pair or new pair with status "PendingSecondPlayer"`,
    }),

    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),

    ApiForbiddenResponse({
      description: 'If current user is already participating in active pair',
    }),
  );
};
