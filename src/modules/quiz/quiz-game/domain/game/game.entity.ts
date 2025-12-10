import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { Player } from '../player/player.entity';
import { GameStatusesEnum } from './game-statuses.enum';
import { CreateGameDomainDto } from './dto/create-game.domain-dto';
import { GameQuestion } from '../game-question/game-question.entity';

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
    default: () => 'NOW()',
  })
  pairCreatedDate: Date;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  startGameDate: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  finishGameDate: Date | null;

  //::TODO насколько примемлимые опции в cascade.
  @OneToMany(() => GameQuestion, (gq) => gq.game, {
    nullable: true,
    // cascade: ['insert', 'update', 'recover', 'soft-remove'],
  })
  questions: GameQuestion[];

  static createPending(dto: CreateGameDomainDto): Game {
    const game = new this();
    game.firstPlayerId = dto.firstPlayerId;
    game.secondPlayerId = null;
    game.status = GameStatusesEnum.pending;
    game.startGameDate = null;
    game.finishGameDate = null;
    return game;
  }

  joinSecondPlayer(playerId: string) {
    if (this.secondPlayerId) {
      throw new Error(`Second Player is already joined`);
    }
    if (this.status !== GameStatusesEnum.pending) {
      throw new Error('Game is not pending');
    }
    this.secondPlayerId = playerId;
  }

  assignQuestions(questions: GameQuestion[]) {
    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error(
        'Questions must be an array and not empty. Count questions must be equal 5.',
      );
    }
    this.questions = questions;
  }

  startGame() {
    if (this.status !== GameStatusesEnum.pending) {
      throw new Error('Game is already in progress');
    }
    if (!this.secondPlayerId) {
      throw new Error('Second player not joined yet');
    }
    this.startGameDate = new Date();
    this.status = GameStatusesEnum.active;
  }
}
