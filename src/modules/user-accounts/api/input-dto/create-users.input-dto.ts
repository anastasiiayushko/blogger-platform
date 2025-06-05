import { IsEmail, IsString, Length, Matches } from 'class-validator';
import {
  emailConstraints,
  loginConstraints,
  passwordConstraints,
} from '../../domin/user.entity';
import { Trim } from '../../../../core/decorators/transform/trim';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUsersInputDto {
  @ApiProperty({
    type: String,
    minLength: loginConstraints.minLength,
    maxLength: loginConstraints.maxLength,
    pattern: `${loginConstraints.match}`,
    example: `string`,
  })
  @Trim()
  @IsString()
  @Length(loginConstraints.minLength, loginConstraints.maxLength)
  @Matches(loginConstraints.match)
  login: string;

  @ApiProperty({
    type: String,
    pattern: `${emailConstraints.match}`,
    example: `string`,
  })
  @Trim()
  @IsEmail()
  @Matches(emailConstraints.match)
  email: string;

  @ApiProperty({
    type: String,
    minLength: passwordConstraints.minLength,
    maxLength: passwordConstraints.maxLength,
  })
  @Trim()
  @IsString()
  @Length(passwordConstraints.minLength, passwordConstraints.maxLength)
  password: string;
}
