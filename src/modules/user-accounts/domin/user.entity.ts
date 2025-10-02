import { Column, Entity, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../core/base-orm-entity/base-orm-entity';
import { EmailConfirmation } from './email-confirmation.entity';

@Entity('users')
export class User extends BaseOrmEntity {
  @Column({ type: 'varchar', unique: true })
  login: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ type: 'varchar' })
  password: string;

  @OneToOne(() => EmailConfirmation, (e) => e.user, {cascade:true})
  emailConfirmation: EmailConfirmation;

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
