import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { Player } from '../player/player.entity';
import { GameStatusesEnum } from './game-statuses.enum';
import { CreateGameDomainDto } from './dto/create-game.domain-dto';
import { GameQuestion } from '../game-question/game-question.entity';
import { randomUUID } from 'crypto';
import { PlayerResultEnum } from '../player/player-result.enum';
import { GameTask } from '../game-task/game-task.entity';
import { Answer } from '../answer/answer.entity';
import { Question } from '../../../sa-question/domain/question.entity';

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

  @OneToOne(() => GameTask, (gt) => gt.game, {})
  task: GameTask | null;
  @Column('uuid', { nullable: true, default: null })
  taskId: string | null;

  static createPending(dto: CreateGameDomainDto): Game {
    const game = new this();
    game.id = randomUUID();
    game.firstPlayerId = dto.firstPlayerId;
    game.secondPlayerId = null;
    game.status = GameStatusesEnum.pending;
    game.startGameDate = null;
    game.finishGameDate = null;
    game.questions = null;
    game.task = null;
    return game;
  }

  joinSecondPlayer(player: Player) {
    if (this.secondPlayerId) {
      throw new Error(`Second Player is already joined`);
    }
    if (this.status !== GameStatusesEnum.pending) {
      throw new Error('Game is not pending');
    }
    //::TODO икапсулировать создание игрока
    // const player =  Player.createPlayer({userId: userId})
    this.secondPlayer = player;
    this.secondPlayerId = player.id;
  }
  setGameQuestions(questions: Question[]) {
    if (!Array.isArray(questions) || questions.length !== 5) {
      throw new Error(
        'Questions must be an array and not empty. Count questions must be equal 5.',
      );
    }
    this.questions = GameQuestion.createMany(questions, this.id);
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

  private resolveBonusPlayerId() {
    const firstPlrSummary = this.firstPlayer.getAnswerSummary();
    const secondPlrSummary = this.secondPlayer!.getAnswerSummary();

    const firstCompleted = firstPlrSummary.hasAllAnswers;
    const secondCompleted = secondPlrSummary.hasAllAnswers;

    if (firstCompleted && !secondCompleted) {
      return firstPlrSummary.hasOneCorrectStatus ? this.firstPlayer.id : null;
    }

    if (!firstCompleted && secondCompleted) {
      return secondPlrSummary.hasOneCorrectStatus
        ? this.secondPlayer!.id
        : null;
    }

    if (!firstCompleted && !secondCompleted) {
      return null;
    }

    const fistPlayerTimeLast = Number(firstPlrSummary.timeLastAnswer);
    const secondPlayerTimeLast = Number(secondPlrSummary.timeLastAnswer);

    if (fistPlayerTimeLast < secondPlayerTimeLast) {
      return firstPlrSummary.hasOneCorrectStatus ? this.firstPlayer.id : null;
    }

    if (secondPlayerTimeLast < fistPlayerTimeLast) {
      return secondPlrSummary.hasOneCorrectStatus
        ? this.secondPlayer!.id
        : null;
    }

    return null;
  }

  private determineWinner() {
    const bonusPlayerId = this.resolveBonusPlayerId();

    if (this.firstPlayerId === bonusPlayerId) {
      this.firstPlayer.addBonusPoint()
    }
    if(this.secondPlayerId === bonusPlayerId) {
      this.secondPlayer?.addBonusPoint()
    }

    // if (
    //   firstPlayer.time < secondPlayer.time &&
    //   firstPlayer.hasOneCorrectStatus
    // ) {
    //   this.firstPlayer.addBonusPoint();
    // }
    // if (
    //   secondPlayer.lastAddedAt.getTime() < firstPlayer.lastAddedAt.getTime() &&
    //   secondPlayer.hasOneCorrectStatus
    // ) {
    //   this!.secondPlayer!.addBonusPoint();
    // }
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
      console.log('this game is already in progress ->', this.status);
      console.log(
        'this firstPlayer is already in progress ->',
        this.firstPlayer,
      );
      console.log(
        'this secondPlayer is already in progress ->',
        this.secondPlayer,
      );
      // throw new Error('The game has an incorrect status for completion.');
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

  autoFinalizedGame() {
    this.firstPlayer.finished();
    this.secondPlayer!.finished();
    this.determineWinner();
    this.finishedGame();
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
