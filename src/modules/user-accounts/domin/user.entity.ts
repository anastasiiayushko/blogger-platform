import { Column, Entity, OneToMany, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../core/base-orm-entity/base-orm-entity';
import { EmailConfirmation } from './email-confirmation.entity';
import { SessionDevice } from './session-device.entity';
import { PasswordRecovery } from './password-recovery.entity';
import { IsEmail } from 'class-validator';
import { CommentReaction } from '../../bloggers-platform/comments/domain/comment-reactions.entity';
import { PostReaction } from '../../bloggers-platform/posts/domain/post-reactions.entity';
import { Player } from '../../quiz/quiz-game/domain/player/player.entity';
import { GameStatistic } from '../../quiz/quiz-game/domain/game-statistic/game-statistic.entity';

@Entity('user')
export class User extends BaseOrmEntity {
  @Column({ type: 'varchar', unique: true, collation: 'C' })
  login: string;

  @Column({ type: 'varchar', unique: true, collation: 'C' })
  @IsEmail()
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @OneToOne(() => EmailConfirmation, (e) => e.user, { cascade: true })
  emailConfirmation: EmailConfirmation;

  @OneToMany(() => SessionDevice, (securityDevice) => securityDevice.user, {})
  sessionDevices: SessionDevice[];

  @OneToOne(() => PasswordRecovery, (pr) => pr.user, {})
  passwordRecovery: PasswordRecovery;

  @OneToMany(() => CommentReaction, (cr) => cr.user, {})
  reactions: CommentReaction[];

  @OneToMany(() => PostReaction, (cr) => cr.user, {})
  postReactions: CommentReaction[];

  @OneToMany(() => Player, (p) => p.user, {})
  players: Player[];


  @OneToOne(()=>GameStatistic, (game) => game.user, {})
  gameStatistic: GameStatistic;

  static createInstance(userInput: {
    login: string;
    email: string;
    passwordHash: string;
  }): User {
    const user = new User();
    user.login = userInput.login;
    user.email = userInput.email;
    user.password = userInput.passwordHash;

    return user;
  }

  updatePassword(newPassword: string) {
    this.password = newPassword;
  }
}
