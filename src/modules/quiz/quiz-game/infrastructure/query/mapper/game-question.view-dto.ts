//GamePlayerProgressViewModel
//GameQuestions
import { GameStatusesEnum } from '../../../domain/game/game-statuses.enum';
import { PlayerProgressViewDto } from './player-progress.view-dto';
import { GameQuestion } from '../../../domain/game-question/game-question.entity';
import { Question } from '../../../../sa-question/domain/question.entity';

export class GameQuestionViewDto {
  id: string;
  body: string;

  static mapToView(question: GameQuestion): GameQuestionViewDto {
    const view = new GameQuestionViewDto();
    view.id = question.question.id;
    view.body = question.question.body;
    return view;
  }
}
