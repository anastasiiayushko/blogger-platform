import { Column, Entity, Index, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { User } from '../../../../user-accounts/domin/user.entity';
import { CreatePlayerDomainDto } from './dto/create-player.domain-dto';
import { Answer } from '../answer/answer.entity';
import { randomUUID } from 'crypto';
import { AnswerStatusesEnum } from '../answer/answer-statuses.enum';
import { PlayerResultEnum } from './player-result.enum';
import { PlayerGameStatusEnum } from './player-game-status.enum';

@Entity('player')
@Index('uq_player_active_user', ['userId'], {
  unique: true,
  // Уникальность будет проверяться только для строк, где статус либо
  where: `"game_status" IN ('joined')`,
})
export class Player extends BaseOrmEntity {
  @ManyToOne((type) => User, (user) => user.players)
  user: User;
  @Column({ nullable: false })
  userId: string;

  @Column('int', { nullable: false, default: 0 })
  score: number;

  @OneToMany(() => Answer, (a) => a.player, {})
  answers: Answer[];

  @Column('enum', {
    enum: PlayerGameStatusEnum,
    enumName: 'quiz_player_game_statuses',
    default: PlayerGameStatusEnum.joined,
  })
  gameStatus: PlayerGameStatusEnum;

  @Column('enum', {
    enum: PlayerResultEnum,
    enumName: 'quiz_player_result',
    default: null,
  })
  result: PlayerResultEnum | null;

  static createPlayer(dto: CreatePlayerDomainDto): Player {
    const player = new this();
    player.id = randomUUID();
    player.userId = dto.userId;
    player.score = 0;
    player.answers = [];
    player.gameStatus = PlayerGameStatusEnum.joined;
    return player;
  }

  hasAnsweredAllQuestions() {
    return this.answers.length === 5;
  }

  getIndexAnswerQuestion() {
    return this.answers.length;
  }

  private updateAnswerScore() {
    const corrects = this.answers.filter(
      (a) => a.status === AnswerStatusesEnum.correct,
    );
    this.score = corrects.length;
  }

  addAnswerQuestion(newAnswer: Answer) {
    this.answers.push(newAnswer);
    this.updateAnswerScore();
  }

  getAnswerSummary(): { lastAddedAt: Date; hasOneCorrectStatus: boolean } {
    const lastAnswer = this.answers[this.answers.length - 1];

    return {
      lastAddedAt: lastAnswer.createdAt,
      hasOneCorrectStatus: this.answers.some(
        (a) => a.status === AnswerStatusesEnum.correct,
      ),
    };
  }

  addBonusPoint() {
    if (!this.hasAnsweredAllQuestions()) {
      throw Error(`The player did not answer all the questions.`);
    }
    if (this.score >= 0 && this.score < 5) {
      this.score = this.score + 1;
    }
  }

  finished() {
    this.gameStatus = PlayerGameStatusEnum.finished;
  }
}
