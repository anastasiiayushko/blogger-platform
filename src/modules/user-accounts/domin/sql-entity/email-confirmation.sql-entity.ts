import { randomUUID } from 'crypto';
import { DateUtil } from '../../../../core/utils/DateUtil';
import { BaseExpirationInputDto } from '../../../../core/dto/base.expiration-input-dto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

type ConfirmationPrimitive = {
  id: string | null;
  userId: string;
  code: string;
  expirationAt: Date;
  isConfirmed: boolean;
};

export class EmailConfirmation {
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
  ): EmailConfirmation {
    const expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
    const primaryId = null;
    const code = randomUUID();
    return new EmailConfirmation(primaryId, userId, code, expirationAt, false);
  }

  /** Подтвердить email, проверяя код и срок действия */
  confirm() {
    if (this._isConfirmed || this.isExpired()) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'code', message: 'Email is already confirmed' }],
      });
    }
    this._isConfirmed = true;
  }

  /** Сгенерировать новый код (если ещё не подтверждено) */
  regenerate(expiration: BaseExpirationInputDto) {
    if (this._isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'code', message: 'email is already confirmed' }],
      });
    }
    this._code = randomUUID();
    this._isConfirmed = false;
    this._expirationAt = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
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
  toPrimitives(): ConfirmationPrimitive {
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
    expirationAt: Date | string;
    isConfirmed: boolean;
  }): EmailConfirmation {
    return new EmailConfirmation(
      p.id,
      p.userId,
      p.code,
      p.expirationAt instanceof Date
        ? p.expirationAt
        : new Date(p.expirationAt),
      p.isConfirmed,
    );
  }
}
