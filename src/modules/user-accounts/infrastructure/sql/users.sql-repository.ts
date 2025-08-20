import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { User } from '../../domin/sql-entity/user.sql-entity';
import { UserSqlRow } from './rows/user.sql-row';

@Injectable()
export class UsersSqlRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async findById(id: string): Promise<User | null> {
    const SELECT_QUERY = `
        SELECT *
        FROM public."Users" as u
        WHERE u.id = $1;
    `;
    const userRow = await this.dataSource.query<UserSqlRow[]>(SELECT_QUERY, [
      id,
    ]);
    console.log(userRow);
    if (!userRow || !userRow.length) {
      return null;
    }
    return User.toDomain(userRow[0]);
  }

  /**
   * Created a new user by system.
   * @param {string} login - The LOGIN of the new user -  constrain uniq.
   * @param {string} email -  The EMAIL of the new user - constrain uniq.
   * @param {string} password -  The PASSWORD of the new user.
   * @returns {string} - The ID created user.
   */
  async create(
    login: string,
    email: string,
    password: string,
  ): Promise<string> {
    const inserted: UserSqlRow[] = await this.dataSource.query(
      `
          INSERT INTO public."Users"(login, email, password)
          VALUES ($1, $2, $3) RETURNING *;
      `,
      [login, email, password],
    );
    return inserted?.[0].id;
  }

  /**
   * Deletes a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to delete.
   * @returns {string} - The ID of the deleted user.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */

  async delete(id: string): Promise<boolean> {
    //::TODO создать каскадное удаление или же вынести в команду

    // );
    await this.dataSource.query(
      `
          DELETE
          FROM public."RecoveryPasswordConfirms" as r
          WHERE r."userId" = $1;
      `,
      [id],
    );

    const deletedRows: [[], number] = await this.dataSource.query(
      `
          DELETE
          FROM public."Users"
          WHERE id = $1;
      `,
      [id],
    );
    return (deletedRows?.[1] ?? 0) > 0;
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
  ): Promise<User | null> {
    const SELECT_QUERY = `
        SELECT u.id, u.login, u.email, u.password, u."createdAt"
        FROM public."Users" as u
        where u.login = $1
           or u.email = $2;
    `;
    const paramEmail = email ?? loginOrEmail;
    const userRow = await this.dataSource.query<UserSqlRow[]>(SELECT_QUERY, [
      loginOrEmail,
      paramEmail,
    ]);

    if (!userRow || !userRow.length) {
      return null;
    }
    return User.toDomain(userRow[0]);
  }
}
