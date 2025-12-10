import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { Column, Entity, ManyToOne } from 'typeorm';
import { Player } from '../player/player.entity';
import { AnswerStatusesEnum } from './answer-statuses.enum';

@Entity('answer')
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
}
