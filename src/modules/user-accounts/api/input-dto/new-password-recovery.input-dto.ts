import { IsString, IsNotEmpty, Length } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { passwordConstraints } from '../../domin/user.constraints';

export class NewPasswordRecoveryInputDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  recoveryCode: string;

  @IsString()
  @Trim()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  newPassword: string;
}
