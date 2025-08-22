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

  private async insert(user: User): Promise<UserSqlRow> {
    const INSERT_SQL = `
        INSERT INTO public."Users" (email, login, password)
        VALUES ($1, $2, $3) RETURNING *;
    `;
    const inserted = await this.dataSource.query<UserSqlRow[]>(INSERT_SQL, [
      user.email,
      user.login,
      user.password,
    ]);
    return inserted[0];
  }

  private async update(user: User): Promise<UserSqlRow> {
    const UPDATE_SQL = `
        UPDATE public."Users"
        SET email=$1,
            login=$2,
            password=$3 'updatedAt' = $4
        WHERE public."Users".id = $5 RETURNING *;
        *
    `;
    const updated = await this.dataSource.query<UserSqlRow[]>(UPDATE_SQL, [
      user.email,
      user.login,
      user.password,
      new Date(),
      user.id,
    ]);
    return updated?.[0];
  }

  async save(user: User): Promise<User> {
    let result: UserSqlRow | null = null;

    if (user.id) {
      result = await this.update(user);
    } else {
      result = await this.insert(user);
    }
    if (!result) {
      throw new Error('User saving failed');
    }

    return User.toDomain(result);
  }

  /**
   * Created a new user by system.
   * @param {string} login - The LOGIN of the new user -  constrain uniq.
   * @param {string} email -  The EMAIL of the new user - constrain uniq.
   * @param {string} password -  The PASSWORD of the new user.
   * @returns {string} - The ID created user.
   */
  async create(user: User): Promise<string> {
    const inserted = await this.insert(user);
    if (!inserted) {
      throw new Error('Insert failed');
    }

    return inserted.id;
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
    // await this.dataSource.query(
    //   `
    //       DELETE
    //       FROM public."RecoveryPasswordConfirms" as r
    //       WHERE r."userId" = $1;
    //   `,
    //   [id],
    // );

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
   * @returns Promise<User | null> - Найденный пользователь или null, если не найден.
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
