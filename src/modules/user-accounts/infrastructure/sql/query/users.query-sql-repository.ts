import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { UserSqlRow } from '../rows/user.sql-row';
import { UserSqlViewDto } from '../mapper/users.sql-view-dto';
import { UserMeSqlViewDto } from '../mapper/user-me.sql-view-dto';
import { Injectable } from '@nestjs/common';
import { GetUsersQueryParams } from '../../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

@Injectable()
export class UsersQuerySqlRepository {
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

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserMeSqlViewDto} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */

  async getUserMeById(id: string): Promise<UserMeSqlViewDto> {
    const user = await this.findById(id);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
        extensions: [],
      });
    }
    return UserMeSqlViewDto.mapToView(user);
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserSqlViewDto[]>> {
    const conditions: string[] = [];
    const params: any[] = [];
    let WHERE_FILTER = '';

    if (query.searchEmailTerm) {
      params.push(`%${query.searchEmailTerm}%`);
      conditions.push(` email ILIKE $${params.length} `);
    }

    if (query.searchLoginTerm) {
      params.push(`%${query.searchLoginTerm}%`);
      conditions.push(` login ILIKE $${params.length} `);
    }

    if (conditions.length) {
      WHERE_FILTER = `WHERE ` + conditions.join(' or ');
    }
    //::TODO  COLLATE
    const SQL_PAGING = `
        SELECT u.*
        FROM public."Users" as u
            ${WHERE_FILTER}
        ORDER BY "${query.sortBy}" ${query.sortDirection}
        OFFSET ${query.calculateSkip()} limit ${query.pageSize}
    `;

    const SQL_COUNT = `
        SELECT count(*)
        FROM public."Users" ${WHERE_FILTER};
    `;

    const totalCount = await this.datasource.query<{ count: number }[]>(
      SQL_COUNT,
      params,
    );

    const items = await this.datasource.query<UserSqlRow[]>(SQL_PAGING, params);

    return PaginatedViewDto.mapToView({
      items: items.map((item) => UserSqlViewDto.mapToView(item)),
      totalCount: +totalCount[0].count,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
