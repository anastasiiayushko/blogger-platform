import { UserDocument } from '../../domin/user.entity';

export class UserMeViewDto {
  userId: string;
  email: string;
  login: string;

  static mapToView(user: UserDocument): UserMeViewDto {
    const dto = new UserMeViewDto();
    dto.userId = user._id.toString();
    dto.email = user.email;
    dto.login = user.login;
    return dto;
  }
}
