import { Column, Entity, ManyToOne, Unique, Generated } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { Game } from '../game/game.entity';
import { Question } from '../../../sa-question/domain/question.entity';

@Entity('game_question')
@Unique(['gameId', 'questionId'])
export class GameQuestion extends BaseOrmEntity {
  @ManyToOne(() => Game, (g) => g.questions)
  game: Game;
  @Column('uuid')
  gameId: string;

  @ManyToOne(() => Question, (q) => q.gameQuestions)
  question: Question;
  @Column('uuid')
  questionId: string;

  @Generated('increment') // в новых версиях создаёт IDENTITY
  @Column('int')
  order: number;

  static createQuestion(questionId, gameId: string): GameQuestion {
    const gQuestion = new GameQuestion();
    gQuestion.gameId = gameId;
    gQuestion.questionId = questionId;
    return gQuestion;
  }

  static createMany(questions: Question[], gameId: string): GameQuestion[] {
    if (!Array.isArray(questions)) {
      throw new Error('Questions must be an array');
    }
    return questions.map((q, index) => {
      const item = new GameQuestion();
      item.questionId = q.id;
      item.gameId = gameId;
      item.order = index + 1;
      return item;
    });
  }
}
