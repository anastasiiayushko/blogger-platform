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
    // cascade: ['insert', 'update'],
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
    // const isCorrect = question.answers.includes(
    //   currentAnswer.trim().toLowerCase(),
    // );
    // const newAnswer = Answer.createAnswer({
    //   playerId: this.id,
    //   questionId: question.id,
    //   status: isCorrect
    //     ? AnswerStatusesEnum.correct
    //     : AnswerStatusesEnum.incorrect,
    // });
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
}
