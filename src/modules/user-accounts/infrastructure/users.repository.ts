import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domin/user.entity';
import { CreateUserDomainDto } from '../domin/dto/create-user.domain.dto';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { Types } from 'mongoose';

@Injectable()
export class UsersRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  /**
   * Deletes a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to delete.
   * @returns {string} - The ID of the deleted user.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */

  async delete(id: string): Promise<boolean> {
    const result = await this.UserModel.deleteOne({
      _id: new Types.ObjectId(id),
    });
    return !!result.deletedCount;
  }

  create(dto: CreateUserDomainDto): UserDocument {
    return this.UserModel.createInstance(dto);
  }

  async save(user: UserDocument) {
    await user.save();
  }

  async findOrNotFoundFail(id: string): Promise<string> {
    const user = await this.UserModel.findById(new Types.ObjectId(id));
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
        extensions: [],
      });
    }
    return user._id.toString();
  }

  /**
   * Поиск пользователя по логину или email.
   *
   * Если передан только один аргумент — он будет использоваться и как логин, и как email.
   * Если переданы оба аргумента, email будет использоваться как второй критерий.
   *
   * @param loginOrEmail - Логин или email пользователя (обязательный).
   * @param email - Email пользователя (необязательный). Если не указан, используется значение loginOrEmail.
   * @returns Promise<UserDocument | null> - Найденный пользователь или null, если не найден.
   */
  async findByEmailOrLogin(
    loginOrEmail: string,
    email?: string,
  ): Promise<UserType | null> {
    const user = await this.UserModel.findOne({
      $or: [
        {
          login: loginOrEmail,
        },
        {
          email: email ?? loginOrEmail,
        },
      ],
    });
    if (!user) {
      return null;
    }
    return {
      id: user._id.toString(),
      email: user.email,
      password: user.password,
      login: user.login,
    };
  }
}

type UserType = {
  id: string;
  email: string;
  password: string;
  login: string;
};
