import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { User } from '../domin/user.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id })
      // .andWhere('u.deletedAt IS NULL')
      .printSql()
      .getOne();

    if (!user) {
      return null;
    }
    return user;
  }

  async findByEmailOrLogin(
    loginOrEmail: string,
    email?: string,
  ): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .where('u.login = :login OR u.email = :email', {
        login: loginOrEmail,
        email: email ?? loginOrEmail,
      })
      .printSql()
      .getOne();

    if (!user) {
      return null;
    }
    return user;
  }

  /**
   * Поиск пользователя по логину или email.
   *
   * Если передан только один аргумент — он будет использоваться и как логин, и как email.
   * Если переданы оба аргумента, email будет использоваться как второй критерий.
   *
   * @param loginOrEmail - Логин или email пользователя (обязательный).
   * @param email - Email пользователя (необязательный). Если не указан, используется значение loginOrEmail.
   * @returns Promise<User_root | null> - Найденный пользователь или null, если не найден.
   */
  async findOrNotFoundFail(userId: string): Promise<User> {
    const user = await this.findById(userId);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User_root does not exist',
      });
    }
    return user;
  }

  async save(user: User): Promise<User> {
    return await this.userRepository.save(user);
  }

  /**
   * Deletes a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to delete.
   * @returns {string} - The ID of the deleted user.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */

  async softDelete(userId: string): Promise<boolean> {
    const result = await this.userRepository
      .createQueryBuilder()
      .softDelete()
      .where('id = :id', { id: userId })
      .printSql()
      .execute();
    console.log('soft deleted successfully. result: ', result);
    return true;
  }
}
