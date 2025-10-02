import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { BaseOrmEntity } from '../../../core/base-orm-entity/base-orm-entity';
import { User } from './user.entity';
import { DateUtil } from '../../../core/utils/DateUtil';
import { randomUUID } from 'crypto';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { BaseExpirationInputDto } from '../../../core/dto/base.expiration-input-dto';

@Entity('email_confirmations')
export class EmailConfirmation extends BaseOrmEntity {
  @Column({ type: 'boolean' })
  isConfirmed: boolean;

  @Column({ type: 'uuid', nullable: false })
  code: string;

  @Column({ type: 'timestamp', nullable: false })
  expirationAt: Date;

  @OneToOne(() => User, (user) => user.emailConfirmation)
  @JoinColumn()
  user: User;

  @Column('uuid')
  userId: string;

  static createInstance(
    expiration: {
      hours: number;
      min: number;
    },
    isConfirmed: boolean,
  ): EmailConfirmation {
    const expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
    const primaryId = null;
    const code = randomUUID();
    const emailConfirmation = new EmailConfirmation();
    emailConfirmation.code = code;
    emailConfirmation.expirationAt = expirationAt;
    emailConfirmation.isConfirmed = isConfirmed;
    return emailConfirmation;
  }

  isExpired(currentDate: Date = new Date()) {
    return DateUtil.hasExpired(currentDate, this.expirationAt);
  }

  /** Подтвердить email, проверяя код и срок действия */
  confirm() {
    if (this.isConfirmed || this.isExpired()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          {
            field: 'code',
            message: `Email is already confirmed  isConfirmed = ${this.isConfirmed} or isExpired = ${this.isExpired()}`,
          },
        ],
      });
    }
    this.isConfirmed = true;
  }

  /** Сгенерировать новый код (если ещё не подтверждено) */
  regenerate(expiration: BaseExpirationInputDto) {
    if (this.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'code', message: 'email is already confirmed' }],
      });
    }
    this.code = randomUUID();
    this.isConfirmed = false;
    this.expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
  }
}
