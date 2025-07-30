import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { DateUtil } from '../../../core/utils/DateUtil';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { BaseExpirationInputDto } from '../../../core/dto/base.expiration-input-dto';

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
  match: /^[a-zA-Z0-9_-]*$/,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

export const emailConstraints = {
  match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/,
};

@Schema({ timestamps: true })
export class User {
  /**
   * Email of the user
   * @type{string}
   * @required
   */
  @Prop({
    required: true,
    unique: true,
    type: String,
    match: emailConstraints.match,
    trim: true,
  })
  email: string;

  /**
   * Login of the user (must be uniq)
   * @type{string}
   * @required
   */
  @Prop({
    trim: true,
    required: true,
    unique: true,
    type: String,
    minlength: loginConstraints.minLength,
    maxlength: loginConstraints.maxLength,
    match: loginConstraints.match,
  })
  login: string;

  /**
   * Email of the user
   * @type{string}
   * @required
   */

  /**
   * Password hash for authentication
   * @type {string}
   * @required
   */
  @Prop({
    trim: true,
    required: true,
    type: String,
  })
  password: string;

  @Prop(
    raw({
      confirmationCode: { type: String },
      expirationDate: { type: Date, default: new Date() },
      isConfirmed: { type: Boolean, default: false },
    }),
  )
  emailConfirmation: {
    confirmationCode: string;
    expirationDate: Date;
    isConfirmed: boolean;
  };

  @Prop(
    raw({
      recoveryCode: { type: String, default: null },
      expirationDate: { type: Date, default: null },
      isConfirmed: { type: Boolean, default: false },
    }),
  )
  recoveryPasswordConfirm: {
    recoveryCode: string | null;
    expirationDate: Date | null;
    isConfirmed: boolean;
  };

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  static createInstance(
    dto: CreateUserDomainDto,
    expiration: BaseExpirationInputDto,
  ) {
    const user = new this();
    user.email = dto.email;
    user.password = dto.passwordHash;
    user.login = dto.login;
    user.recoveryPasswordConfirm = {
      recoveryCode: null,
      expirationDate: null,
      isConfirmed: false,
    };

    const expirationDate = DateUtil.add(new Date(), {
      hours: expiration.hours,
      minutes: expiration.min,
    });
    console.log(expirationDate, 'expirationDate', new Date());
    user.emailConfirmation = {
      expirationDate: expirationDate,
      isConfirmed: false,
      confirmationCode: new Types.ObjectId().toString(),
    };
    return user as UserDocument;
  }

  confirmEmail() {
    if (this.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'code', message: 'Email is already confirmed' }],
      });
    }
    this.emailConfirmation.isConfirmed = true;
  }

  /** задать новые настройки для подтверждения почты  */
  generateNewCodeOfConfirmEmail(expiration: BaseExpirationInputDto) {
    if (this.emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'code', message: 'email is already confirmed' }],
      });
    }
    this.emailConfirmation = {
      expirationDate: DateUtil.add(new Date(), {
        hours: expiration.hours,
        minutes: expiration.min,
      }),
      isConfirmed: false,
      confirmationCode: new Types.ObjectId().toString(),
    };
  }

  /** задать новые настройки для сброса пароля  */
  generateNewCodeOfRecoveryPassword(expiration: BaseExpirationInputDto) {
    if (this.recoveryPasswordConfirm.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'ps', message: 'password is already confirmed' }],
      });
    }
    this.recoveryPasswordConfirm = {
      isConfirmed: false,
      expirationDate: DateUtil.add(new Date(), {
        hours: expiration.hours,
        minutes: expiration.min,
      }),
      recoveryCode: new Types.ObjectId().toString(),
    };
  }

  /** обновить пароль и установить флаг что параль успешно подтвержден */
  updateNewPassword(newPasswordHash: string) {
    if (this.recoveryPasswordConfirm.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'ps', message: 'password is already confirmed' }],
      });
    }
    this.password = newPasswordHash;
    this.recoveryPasswordConfirm.isConfirmed = true;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
