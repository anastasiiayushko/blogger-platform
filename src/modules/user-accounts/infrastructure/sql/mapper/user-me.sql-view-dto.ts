import { UserSqlRow } from '../rows/user.sql-row';

export class UserMeSqlViewDto {
  userId: string;
  login: string;
  email: string;

  /**
   * Converts a row slq  into a UserMeSqlViewDto.
   * @param {UserSqlRow} user - The user row from the database.
   * @returns {UserViewDto} - The transformed user DTO.
   */
  static mapToView(user: UserSqlRow): UserMeSqlViewDto {
    const dto = new UserMeSqlViewDto();
    dto.userId = user.id.toString();
    dto.login = user.login;
    dto.email = user.email;
    return dto;
  }
}
