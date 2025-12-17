import { Controller, Get, Post } from '@nestjs/common';

@Controller('pair-game-quiz/pairs')
export class PairGameController {
  @Get('/my-current')
  myCurrentUnfinishedGame() {}

  @Get(':id')
  pairGame() {}

  @Post('/connection')
  joinGame() {}

  @Post('/my-current/answer')
  answerGame() {}
}
