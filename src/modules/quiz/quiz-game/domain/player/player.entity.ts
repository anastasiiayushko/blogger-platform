import { Column, Entity, ManyToOne, OneToMany } from 'typeorm';
import { BaseOrmEntity } from '../../../../../core/base-orm-entity/base-orm-entity';
import { User } from '../../../../user-accounts/domin/user.entity';
import { CreatePlayerDomainDto } from './dto/create-player.domain-dto';
import { Answer } from '../answer/answer.entity';
import { randomUUID } from 'crypto';
import { Question } from '../../../sa-question/domain/question.entity';
import { AnswerStatusesEnum } from '../answer/answer-statuses.enum';

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

  hasAnsweredAllQuestions() {
    return this.answers.length === 5;
  }

  getIndexAnswer() {
    return this.answers.length;
  }

  addAnswer(question: Question, currentAnswer: string) {
    const isCorrect = question.answers.includes(
      currentAnswer.trim().toLowerCase(),
    );
    const newAnswer = Answer.createAnswer({
      playerId: this.id,
      questionId: question.id,
      status: isCorrect
        ? AnswerStatusesEnum.correct
        : AnswerStatusesEnum.incorrect,
    });
    this.answers.push(newAnswer);

    const score = isCorrect ? this.score + 1 : this.score - 1;
    this.score = score < 0 ? 0 : score > 5 ? 5 : score;
  }

  getAnswerSummary(): { lastAddedAt: Date; hasOneCorrectStatus: boolean } {
    return {
      lastAddedAt: new Date(),
      hasOneCorrectStatus: true,
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
}
