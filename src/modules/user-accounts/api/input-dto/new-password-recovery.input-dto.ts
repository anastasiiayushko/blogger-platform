import { IsString, IsNotEmpty, Length, IsUUID } from 'class-validator';
import { Trim } from '../../../../core/decorators/transform/trim';
import { passwordConstraints } from '../../domin/user.constraints';

export class NewPasswordRecoveryInputDto {
  @IsNotEmpty()
  @IsString()
  @Trim()
  @IsUUID()
  recoveryCode: string;

  @IsString()
  @Trim()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  newPassword: string;
}
