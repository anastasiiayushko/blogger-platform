import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { User } from '../../../../user-accounts/domin/user.entity';
import { CreatePlayerDomainDto } from './dto/create-player.domain-dto';
import { Answer } from '../answer/answer.entity';
import { randomUUID } from 'crypto';

@Entity('player')
export class Player extends BaseOrmEntity {
  @ManyToOne((type) => User, (user) => user.players)
  user: User;
  @Column({ nullable: false })
  userId: string;

  @Column('int', { nullable: false, default: 0 })
  score: number;

  @OneToMany(() => Answer, (a) => a.player, {
    cascade: ['insert', 'update'],
  })
  answers: Answer[];

  static createPlayer(dto: CreatePlayerDomainDto): Player {
    const player = new this();
    player.id = randomUUID();
    player.userId = dto.userId;
    player.score = 0;
    player.answers = [];
    return player;
  }
}
