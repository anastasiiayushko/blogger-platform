import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { Player } from '../player/player.entity';
import { GameStatusesEnum } from './game-statuses.enum';

@Entity('game')
export class Game extends BaseOrmEntity {
  @OneToOne(() => Player, (p) => p.id, { nullable: false })
  @JoinColumn()
  firstPlayer: Player;

  @Column('uuid', { nullable: false })
  firstPlayerId: string;

  @OneToOne(() => Player, (p) => p.id, { nullable: true })
  @JoinColumn()
  secondPlayer: Player | null;

  @Column('uuid', { nullable: true, default: null })
  secondPlayerId: string | null;

  @Column({
    type: 'enum',
    enum: GameStatusesEnum,
    enumName: 'quiz_game_statuses',
    default: GameStatusesEnum.pending,
  })
  status: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    default: ()=> 'NOW()',
  })
  pairCreatedDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  startGameDate: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  finishGameDate: Date | null;
}
