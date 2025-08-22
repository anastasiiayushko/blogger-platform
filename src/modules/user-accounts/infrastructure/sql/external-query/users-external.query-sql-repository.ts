import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { UserSqlViewDto } from '../mapper/users.sql-view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UserSqlRow } from '../rows/user.sql-row';

@Injectable()
export class UsersExternalQuerySqlRepository {
  constructor(@InjectDataSource() protected datasource: DataSource) {}

  private async findById(id: string): Promise<UserSqlRow | null> {
    const SELECT_QUERY = `
        SELECT *
        FROM public."Users"
        WHERE public."Users".id = $1;
    `;

    const userRow = await this.datasource.query<UserSqlRow[]>(SELECT_QUERY, [
      id,
    ]);
    if (!userRow || !userRow.length) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
        extensions: [],
      });
    }
    return userRow[0];
  }

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserSqlViewDto} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<UserSqlViewDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
        extensions: [],
      });
    }
    return UserSqlViewDto.mapToView(user);
  }
}
