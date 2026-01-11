import { applyDecorators } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AnswerViewDto } from '../view-dto/answer.view-dto';

export const GameSendAnswerDocDecorator = () => {
  return applyDecorators(
    ApiOperation({
      summary: `Send answer for next not answered question in active pair`,
    }),
    ApiBearerAuth(),
    ApiOkResponse({
      type: () => AnswerViewDto,
      description: `
Returns answer result`,
    }),

    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),

    ApiForbiddenResponse({
      description:
        'If current user is not inside active pair or user is in active pair but has already answered to all questions',
    }),
  );
};
