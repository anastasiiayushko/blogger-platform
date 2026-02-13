import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { Column, Entity, Index, ManyToOne, Unique } from 'typeorm';
import { Player } from '../player/player.entity';
import { AnswerStatusesEnum } from './answer-statuses.enum';

@Entity('answer')
@Unique('UQ_answer_player_question', ['playerId', 'questionId'])
export class Answer extends BaseOrmEntity {
  @ManyToOne(() => Player, (player) => player.answers)
  player: Player;

  @Column('uuid')
  playerId: string;

  @Column('uuid')
  questionId: string;

  @Column({
    type: 'enum',
    enum: AnswerStatusesEnum,
    enumName: 'answer_statuses_enum',
  })
  status: AnswerStatusesEnum;

  static createAnswer({
    questionId,
    status,
    playerId,
  }: {
    questionId: string;
    status: AnswerStatusesEnum;
    playerId: string;
    // player: Player;
  }): Answer {
    const answer = new Answer();
    answer.playerId = playerId;
    answer.questionId = questionId;
    answer.status = status;
    return answer;
  }
}
