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
  order: number;
}
