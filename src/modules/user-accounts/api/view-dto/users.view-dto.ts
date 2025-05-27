import { UserDocument } from '../../domin/user.entity';

export class UserViewDto {
  id: string;
  login: string;
  email: string;
  createdAt: string;

  /**
   * Converts a Mongoose UserDocument into a UserViewDto.
   * @param {UserDocument} user - The user document from the database.
   * @returns {UserViewDto} - The transformed user DTO.
   */
  static mapToView(user: UserDocument): UserViewDto {
    const dto = new UserViewDto();
    dto.id = user._id.toString();
    dto.login = user.login;
    dto.email = user.email;
    dto.createdAt = user.createdAt.toISOString();
    return dto;
  }
}
