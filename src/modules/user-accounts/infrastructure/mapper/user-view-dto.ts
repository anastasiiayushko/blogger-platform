import { User } from '../../domin/user.entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  /**
   * Converts a row slq   into a UserViewDto.
   * @param {User} user - The user from the database.
   * @returns {UserSqlViewDto} - The transformed user DTO.
   */
  static mapToView(user: User): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user.id;
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
