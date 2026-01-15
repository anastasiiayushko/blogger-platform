import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { User } from '../../../../user-accounts/domin/user.entity';
import { Player } from '../player/player.entity';
import { PlayerResultEnum } from '../player/player-result.enum';

@Entity('game_statistic')
export class GameStatistic extends BaseOrmEntity {
  @OneToOne(() => User, (user) => user.gameStatistic)
  @JoinColumn()
  user: User;

  @Column('uuid', { unique: true })
  userId: string;

  @Column('int')
  sumScore: number;

  @Column('numeric', { precision: 10, scale: 2 })
  avgScore: number;

  @Column('int')
  gameCount: number;

  @Column('int')
  winsCount: number;

  @Column('int')
  lossesCount: number;

  @Column('int')
  drawsCount: number;

  static createStatistic(userId: string): GameStatistic {
    const statistic = new GameStatistic();
    statistic.userId = userId;
    statistic.avgScore = 0;
    statistic.sumScore = 0;

    statistic.gameCount = 0;

    statistic.winsCount = 0;
    statistic.lossesCount = 0;
    statistic.drawsCount = 0;

    return statistic;
  }

  recalculateStatisticAfterGame(player: Player) {
    this.gameCount = this.gameCount + 1;

    this.sumScore = this.sumScore + player.score;
    this.avgScore = this.sumScore / this.gameCount;

    this.winsCount = this.winsCount + Number(player.result === PlayerResultEnum.win);
    this.lossesCount = this.lossesCount + Number(player.result === PlayerResultEnum.lose);
    this.drawsCount = this.drawsCount + Number(player.result === PlayerResultEnum.draw);
  }
}
