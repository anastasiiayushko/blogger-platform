//GamePlayerProgressViewModel
//GameQuestions
import { GameStatusesEnum } from '../../../domain/game/game-statuses.enum';
import { PlayerProgressViewDto } from './player-progress.view-dto';
import { GameQuestionViewDto } from './game-question.view-dto';
import { Game } from '../../../domain/game/game.entity';
import { Player } from '../../../domain/player/player.entity';

export class GamePairViewDto {
  id: string;
  firstPlayerProgress: PlayerProgressViewDto;
  secondPlayerProgress: PlayerProgressViewDto | null = null;
  questions: GameQuestionViewDto[] | null = null;
  status: string;
  pairCreatedDate: string;
  startGameDate: string | null = null;
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
      gameView.questions = game.questions?.map(q => GameQuestionViewDto.mapToView(q));
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
