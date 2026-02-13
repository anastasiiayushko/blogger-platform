import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  VersionColumn,
} from 'typeorm';
import { Game } from '../game/game.entity';
import { GameTaskStatuses } from './game-task.statuses.enum';

@Entity('game_tasks')
export class GameTask {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Game, (g) => g.task, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  game: Game;

  @Column({
    type: 'uuid',
    unique: true,
  })
  gameId: string;

  @Column({
    type: 'enum',
    enum: GameTaskStatuses,
    default: GameTaskStatuses.PENDING,
  })
  status: GameTaskStatuses;

  @Column({
    type: 'timestamp with time zone',
    // nullable: true,
  })
  executeAt: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
  })
  lockedUntil: Date | null;

  @VersionColumn()
  version: number;

  static createTask(gameId: string): GameTask {
    const task = new this();
    task.gameId = gameId;
    return task;
  }
}
