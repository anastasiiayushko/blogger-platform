import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserFormRequest } from '../../../../../user-accounts/decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../../../../../user-accounts/decorators/param/user-context.dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GamePairViewDto } from '../../../infrastructure/query/mapper/game-pair.view-dto';
import { BearerJwtAuthGuard } from '../../../../../user-accounts/guards/bearer/bearer-jwt-auth.guard';
import { GetMyUnfinishedGameDocDecorator } from './docs/get-my-unfinished-game.doc.decorator';
import { GetUserUnfinishedGameQuery } from '../application/query-useceses/get-user-unfinished-game.query-usecase';
import { UuidValidationPipe } from '../../../../../../core/pipes/uuid-validation-transform-pipe';
import { GetGameByIdQuery } from '../application/query-useceses/get-game-by-id.query-usecase';
import { GetGameByIdDocDecorator } from './docs/get-game-by-id.doc.decorator';
import { GamePairConnectionDocDecorator } from './docs/game-pair-connection.doc.decorator';
import { GamePairConnectionCmd } from '../application/usecases/game-pair-connection.usecese';
import { GameSendAnswerDocDecorator } from './docs/game-send-answer.doc.decorator';
import { RecordCurrentAnswerCommand } from '../application/usecases/record-current-answer.usecese';
import { AnswerInputDto } from './input-dto/answer.input-dto';
import { AnswerViewDto } from './view-dto/answer.view-dto';

@Controller('pair-game-quiz/pairs')
@UseGuards(BearerJwtAuthGuard)
export class PairGameController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly commandBus: CommandBus,
  ) {}

  @Get('/my-current')
  @GetMyUnfinishedGameDocDecorator()
  async myCurrentUnfinishedGame(
    @CurrentUserFormRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.queryBus.execute(new GetUserUnfinishedGameQuery(user.id));
  }

  @Get(':id')
  @GetGameByIdDocDecorator()
  async getGameById(
    @Param('id', UuidValidationPipe) id: string,
    @CurrentUserFormRequest() user: UserContextDto,
  ): Promise<GamePairViewDto> {
    return this.queryBus.execute(new GetGameByIdQuery(user.id, id));
  }

  @Post('/connection')
  @HttpCode(HttpStatus.OK)
  @GamePairConnectionDocDecorator()
  async joinGame(@CurrentUserFormRequest() user: UserContextDto) {
    const gameId = await this.commandBus.execute(
      new GamePairConnectionCmd(user.id),
    );
    return this.queryBus.execute(new GetGameByIdQuery(user.id, gameId));
  }
  // pair-game-quiz/pairs/my-current/answers
  @Post('/my-current/answers')
  @HttpCode(HttpStatus.OK)
  @GameSendAnswerDocDecorator()
  async myAnswer(
    @CurrentUserFormRequest() user: UserContextDto,
    @Body() answerInputDto: AnswerInputDto,
  ): Promise<AnswerViewDto> {
    return this.commandBus.execute(
      new RecordCurrentAnswerCommand(user.id, answerInputDto.answer),
    );
  }
}
