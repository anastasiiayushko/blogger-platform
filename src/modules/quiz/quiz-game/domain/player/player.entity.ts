import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { User } from '../../../../user-accounts/domin/user.entity';
import { Game } from '../game/game-entity';

@Entity('player')
export class Player extends BaseOrmEntity {
  @ManyToOne((type) => User, (user) => user.players)
  user: User;
  @Column({ nullable: false })
  userId: string;

  @Column('int', { nullable: false, default: 0 })
  score: number;


}
