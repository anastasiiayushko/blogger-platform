import { User } from '../../domin/user.entity';

export class UserMeViewDto {
  userId: string;
  login: string;
  email: string;

  /**
   * Converts a User into a UserViewDto.
   * @param {User} user - The user row from the database.
   * @returns {UserViewDto} - The transformed user DTO.
   */
  static mapToView(user: User): UserMeViewDto {
    const dto = new UserMeViewDto();
    dto.userId = user.id.toString();
    dto.login = user.login;
    dto.email = user.email;
    return dto;
  }
}
