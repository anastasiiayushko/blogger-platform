import { BaseOrmEntity } from '../../../core/base-orm-entity/base-orm-entity';
import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from './user.entity';
import { DateUtil } from '../../../core/utils/DateUtil';
import { randomUUID } from 'crypto';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';

@Entity()
export class PasswordRecovery extends BaseOrmEntity {
  @Column('uuid', { nullable: false })
  code: string;

  @OneToOne(() => User, (user: User) => user.passwordRecovery, {
    cascade: false, // пользователя не создаём/не апдейтим через PR
    // eager: false,
  })
  @JoinColumn() // делает эту сторону владеющей (owner)
  user: User;

  @Column('timestamptz')
  expirationAt: Date;

  @Column('boolean', { nullable: false, default: false })
  isConfirmed: boolean;

  static createInstance(
    userId: string,
    expiration: { hours: number; min: number },
  ): PasswordRecovery {
    const rp = new PasswordRecovery();
    rp.expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
    rp.code = randomUUID();
    rp.isConfirmed = false;
    rp.user ={id: userId} as User;
    return rp;
  }

  /** установить новые настройки для сброса пароля  */
  regenerate(expiration: { hours: number; min: number }) {
    if (this.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'ps', message: 'password is already confirmed' }],
      });
    }
    this.isConfirmed = false;
    this.code = randomUUID();
    this.expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
  }

  /** обновить пароль и установить флаг что параль успешно подтвержден */
  confirm() {
    if (this.isConfirmed || this.isExpired()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          {
            field: 'ps',
            message: 'password is already confirmed or expired timeout',
          },
        ],
      });
    }
    this.isConfirmed = true;
  }

  isExpired(currentDate: Date = new Date()) {
    return DateUtil.hasExpired(currentDate, this.expirationAt);
  }
}
