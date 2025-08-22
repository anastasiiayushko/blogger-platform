import { UserSqlRow } from '../rows/user.sql-row';

export class UserSqlViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  /**
   * Converts a row slq   into a UserViewDto.
   * @param {UserSqlRow} user - The user row from the database.
   * @returns {UserSqlViewDto} - The transformed user DTO.
   */
  static mapToView(user: UserSqlRow): UserSqlViewDto {
    const dto = new UserSqlViewDto();
    dto.id = user.id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
