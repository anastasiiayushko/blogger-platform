import { AnswerStatusesEnum } from '../../../domain/answer/answer-statuses.enum';
import { Player } from '../../../domain/player/player.entity';

class AnswerViewModel {
  questionId: string;
  answerStatus: AnswerStatusesEnum;
  addedAt: string;
}

class PlayerViewModel {
  id: string;
  login: string;
}

export class PlayerProgressViewDto {
  answers: AnswerViewModel[];
  player: PlayerViewModel;
  score: number;

  static mapToView(player: Player): PlayerProgressViewDto {
    const playerView = new PlayerProgressViewDto();
    playerView.player = {
      id: player.id,
      login: player.user.login,
    };
    playerView.score = player.score;
    playerView.answers = player.answers.map((anw) => {
      return {
        questionId: anw.questionId,
        addedAt: anw.createdAt.toISOString(),
        answerStatus: anw.status,
      };
    });
    return playerView;
  }
}
