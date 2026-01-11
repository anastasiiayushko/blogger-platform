import { applyDecorators } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { GamePairViewDto } from '../../../../infrastructure/query/mapper/game-pair.view-dto';
import { ApiErrorResult } from '../../../../../../../core/exceptions/filters/error-response-body.type';

export const GetGameByIdDocDecorator = () => {
  return applyDecorators(
    ApiOperation({
      summary: `Return game by id`,
    }),
    ApiBearerAuth(),
    ApiOkResponse({ type: GamePairViewDto }),
    ApiNotFoundResponse({
      description:
        'If game not found',
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
    ApiBadRequestResponse({
      description: 'If id has invalid format',
      type: ApiErrorResult,
    }),
    ApiForbiddenResponse({
      description:
        'If current user tries to get pair in which user is not participant',
    }),
  );
};
