//GamePlayerProgressViewModel
//GameQuestions
import { GameQuestion } from '../../../domain/game-question/game-question.entity';
import { ApiProperty } from '@nestjs/swagger';

export class GameQuestionViewDto {
  @ApiProperty({type: String})
  id: string;
  @ApiProperty({type: String})
  body: string;

  static mapToView(question: GameQuestion): GameQuestionViewDto {
    const view = new GameQuestionViewDto();
    view.id = question.question.id;
    view.body = question.question.body;
    return view;
  }
}
