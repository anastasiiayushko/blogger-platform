import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { Player } from '../player/player.entity';
import { GameStatusesEnum } from './game-statuses.enum';
import { CreateGameDomainDto } from './dto/create-game.domain-dto';
import { GameQuestion } from '../game-question/game-question.entity';
import { randomUUID } from 'crypto';
import { PlayerResultEnum } from '../player/player-result.enum';

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

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  startGameDate: Date | null;

  @Column({ type: 'timestamp with time zone', nullable: true, default: null })
  finishGameDate: Date | null;

  @OneToMany(() => GameQuestion, (gq) => gq.game, {
    cascade: true,
    nullable: true,
  })
  questions: GameQuestion[] | null;

  static createPending(dto: CreateGameDomainDto): Game {
    const game = new this();
    game.id = randomUUID();
    game.firstPlayerId = dto.firstPlayerId;
    game.secondPlayerId = null;
    game.status = GameStatusesEnum.pending;
    game.startGameDate = null;
    game.finishGameDate = null;
    game.questions = null;
    return game;
  }

  joinSecondPlayer(player: Player) {
    if (this.secondPlayerId) {
      throw new Error(`Second Player is already joined`);
    }
    if (this.status !== GameStatusesEnum.pending) {
      throw new Error('Game is not pending');
    }
    this.secondPlayer = player;
    this.secondPlayerId = player.id;
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
    if (!this.firstPlayer || !this.secondPlayer) {
      throw new Error('Second player not joined yet');
    }
    if (!this.questions?.length || !this.questions) {
      throw new Error('Questions must be fill, before starting game');
    }
    this.startGameDate = new Date();
    this.status = GameStatusesEnum.active;
  }

  private determineWinner() {
    const firstPlayer = this.firstPlayer.getAnswerSummary();
    const secondPlayer = this.secondPlayer!.getAnswerSummary();

    if (
      firstPlayer.lastAddedAt.getTime() < secondPlayer.lastAddedAt.getTime() &&
      firstPlayer.hasOneCorrectStatus
    ) {
      this.firstPlayer.addBonusPoint();
    }
    if (
      secondPlayer.lastAddedAt.getTime() < firstPlayer.lastAddedAt.getTime() &&
      secondPlayer.hasOneCorrectStatus
    ) {
      this!.secondPlayer!.addBonusPoint();
    }
    const scorePlr1 = +this.firstPlayer.score;
    const scorePlr2 = +this.secondPlayer!.score;

    if (scorePlr1 < scorePlr2) {
      this.secondPlayer!.result = PlayerResultEnum.win;
      this.firstPlayer!.result = PlayerResultEnum.lose;
    } else if (scorePlr1 > scorePlr2) {
      this.firstPlayer!.result = PlayerResultEnum.win;
      this.secondPlayer!.result = PlayerResultEnum.lose;
    } else {
      this.firstPlayer!.result = PlayerResultEnum.draw;
      this.secondPlayer!.result = PlayerResultEnum.draw;
    }
  }

  private finishedGame() {
    if (this.status !== GameStatusesEnum.active) {
      throw new Error('The game has an incorrect status for completion.');
    }

    this.status = GameStatusesEnum.finished;
    this.finishGameDate = new Date();
  }

  tryToFinish() {
    if (
      this.firstPlayer.hasAnsweredAllQuestions() &&
      this.secondPlayer?.hasAnsweredAllQuestions()
    ) {
      this.firstPlayer.finished();
      this.secondPlayer!.finished();
      this.determineWinner();
      this.finishedGame();
      return true;
    }

    return false;
  }

  getPlayersByUserId(userId: string) {
    const currentPlayerKey =
      this.firstPlayer.userId === userId ? 'firstPlayer' : 'secondPlayer';
    const opponentPlayerKey =
      currentPlayerKey === 'firstPlayer' ? 'secondPlayer' : 'firstPlayer';

    const currentPlayer = this[currentPlayerKey] as Player;
    const opponentPlayer = this[opponentPlayerKey] as Player;

    return { currentPlayer, opponentPlayer };
  }
}
