import { UserSqlRow } from '../sql/rows/user.sql-row';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  /**
   * Converts a row slq   into a UserViewDto.
   * @param {UserSqlRow} user - The user row from the database.
   * @returns {UserSqlViewDto} - The transformed user DTO.
   */
  static mapToView(user: UserSqlRow): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
