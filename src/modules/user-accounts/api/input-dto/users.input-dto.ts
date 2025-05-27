import { IsEmail, IsString, Length, Matches } from 'class-validator';
import {
  emailConstraints,
  loginConstraints,
  passwordConstraints,
} from '../../domin/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';

export class UserInputDTO {
  @Trim()
  @IsString()
  @Length(loginConstraints.minLength, loginConstraints.maxLength)
  @Matches(loginConstraints.match)
  login: string;

  @Trim()
  @IsEmail()
  @Matches(emailConstraints.match)
  email: string;

  @Trim()
  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  password: string;
}
