import { GameStatusesEnum } from '../../../domain/game/game-statuses.enum';
import { PlayerProgressViewDto } from './player-progress.view-dto';
import { GameQuestionViewDto } from './game-question.view-dto';
import { Game } from '../../../domain/game/game.entity';
import { Player } from '../../../domain/player/player.entity';
import { ApiProperty } from '@nestjs/swagger';
import { AnswerStatusesEnum } from '../../../domain/answer/answer-statuses.enum';

const examplePlayer: PlayerProgressViewDto = {
  answers: [
    {
      questionId: 'string',
      answerStatus: AnswerStatusesEnum.correct,
      addedAt: '2026-01-04T13:24:45.623Z',
    },
  ],
  score: 0,
  player: {
    id: 'string',
    login: 'string',
  },
};

export class GamePairViewDto {
  @ApiProperty({ type: 'string' })
  id: string;

  @ApiProperty({
    type: () => PlayerProgressViewDto,
    example: examplePlayer,
  })
  firstPlayerProgress: PlayerProgressViewDto;

  @ApiProperty({
    type: () => PlayerProgressViewDto,
    example: examplePlayer,
    nullable: true,
  })
  secondPlayerProgress: PlayerProgressViewDto | null = null;

  @ApiProperty({
    type: () => GameQuestionViewDto,
    nullable: true,
    isArray: true,
  })
  questions: GameQuestionViewDto[] | null = null;

  @ApiProperty({ enum: GameStatusesEnum, enumName: 'GameStatuses' })
  status: string;

  @ApiProperty({ type: 'string', example: '2026-01-04T12:15:18.307Z' })
  pairCreatedDate: string;
  @ApiProperty({
    type: 'string',
    nullable: true,
    example: '2026-01-04T12:15:18.307Z',
  })
  startGameDate: string | null = null;

  @ApiProperty({
    type: 'string',
    nullable: true,
    example: '2026-01-04T12:15:18.307Z',
  })
  finishGameDate: string | null = null;

  static mapToView(game: Game): GamePairViewDto {
    const gameView = new GamePairViewDto();
    const gameIsPendingStatus = game.status === GameStatusesEnum.pending;

    gameView.id = game.id;
    gameView.firstPlayerProgress = PlayerProgressViewDto.mapToView(
      game.firstPlayer,
    );

    if (gameIsPendingStatus) {
      gameView.questions = null;
      gameView.secondPlayerProgress = null;
    } else {
      const questions = Array.isArray(game.questions) ? game.questions : [];
      gameView.questions = questions.map((q) =>
        GameQuestionViewDto.mapToView(q),
      );
      gameView.secondPlayerProgress = PlayerProgressViewDto.mapToView(
        game.secondPlayer as Player,
      );
      // gameView.questions = game.questions!.map(q=> GameQuestionViewDto.mapToView(q));
    }

    gameView.status = game.status;
    gameView.pairCreatedDate = game.createdAt.toISOString();
    gameView.finishGameDate = game.finishGameDate
      ? game.finishGameDate.toISOString()
      : null;
    gameView.startGameDate = game.startGameDate
      ? game.startGameDate.toISOString()
      : null;

    return gameView;
  }
}
