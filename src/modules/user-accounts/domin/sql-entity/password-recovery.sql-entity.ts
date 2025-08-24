import { DateUtil } from '../../../../core/utils/DateUtil';
import { randomUUID } from 'crypto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export type PasswordRecoveryPrimitiveType = {
  id: string | null;
  userId: string;
  code: string;
  expirationAt: Date;
  isConfirmed: boolean;
};

export class PasswordRecovery {
  private constructor(
    /** id=null указывает на то что это ново созданная запись*/
    public readonly id: string | null, // PK
    public readonly userId: string, // FK
    private _code: string,
    private _expirationAt: Date,
    private _isConfirmed: boolean,
  ) {}

  static createInstance(
    userId: string,
    expiration: { hours: number; min: number },
  ): PasswordRecovery {
    const expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
    const primaryId = null;
    const code = randomUUID();
    return new PasswordRecovery(primaryId, userId, code, expirationAt, false);
  }

  /** установить новые настройки для сброса пароля  */
  regenerate(expiration: { hours: number; min: number }) {
    if (this._isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'ps', message: 'password is already confirmed' }],
      });
    }
    this._isConfirmed = false;
    this._code = randomUUID();
    this._expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
  }

  /** обновить пароль и установить флаг что параль успешно подтвержден */
  confirm() {
    if (this._isConfirmed || this.isExpired()) {
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
    this._isConfirmed = true;
  }

  isExpired(currentDate: Date = new Date()) {
    return DateUtil.hasExpired(currentDate, this._expirationAt);
  }

  // Геттеры (чтобы не мутировали поля снаружи)
  get code() {
    return this._code;
  }

  get expirationAt() {
    return this._expirationAt;
  }

  get isConfirmed() {
    return this._isConfirmed;
  }

  /** Для маппера */
  toPrimitives(): PasswordRecoveryPrimitiveType {
    return {
      id: this.id,
      userId: this.userId,
      code: this._code,
      expirationAt: this._expirationAt,
      isConfirmed: this._isConfirmed,
    };
  }

  /** Ре-гидратация из  бд  */
  static toDomain(p: {
    id: string;
    userId: string;
    code: string;
    expirationAt: Date;
    isConfirmed: boolean;
  }): PasswordRecovery {
    return new PasswordRecovery(
      p.id,
      p.userId,
      p.code,
      p.expirationAt,
      p.isConfirmed,
    );
  }
}
