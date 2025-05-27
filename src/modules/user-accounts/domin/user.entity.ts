import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Model, Types } from 'mongoose';
import { CreateUserDomainDto } from './dto/create-user.domain.dto';
import { DateUtil } from '../../../core/utils/DateUtil';

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
      expirationDate: { type: Date, default: new Date() },
      isConfirmed: { type: Boolean, default: false },
    }),
  )
  recoveryPasswordConfirm: {
    recoveryCode: string | null;
    expirationDate: Date;
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

  static createInstance(dto: CreateUserDomainDto, isEmailConfirmed = false) {
    const user = new this();
    user.email = dto.email;
    user.password = dto.passwordHash;
    user.login = dto.login;
    user.recoveryPasswordConfirm = {
      recoveryCode: null,
      expirationDate: new Date(),
      isConfirmed: false,
    };

    user.emailConfirmation = {
      expirationDate: DateUtil.add(new Date(), { hours: 1, minutes: 0 }),
      isConfirmed: isEmailConfirmed,
      confirmationCode: new Types.ObjectId().toString(),
    };
    return user as UserDocument;
  }
}

export const UserSchema = SchemaFactory.createForClass(User);
//регистрирует методы сущности в схеме
UserSchema.loadClass(User);

//Типизация документа
export type UserDocument = HydratedDocument<User>;

//Типизация модели + статические методы
export type UserModelType = Model<UserDocument> & typeof User;
