import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../../../setup/config-validation.utility';

@Injectable()
export class UserConfirmationConfig {
  @IsNotEmpty({
    message:
      'Set Env variable USER_EMAIL_CONFIRMATION_EXPIRES_HOURS to be number, example:[0-23]',
  })

  public emailExpiresInHours: number;

  @IsNotEmpty({
    message:
      'Set Env variable USER_EMAIL_CONFIRMATION_EXPIRES_MIN to be number, example:[0-59]',
  })
  @IsNumber()
  public emailExpiresInMin: number;

  @IsNotEmpty({
    message:
      'Set Env variable USER_RECOVERY_PASSWORD_CONFIRMATION_EXPIRES_HOURS to be number, example:[0-23]',
  })
  @IsNumber()
  public recoveryPasswordExpiresInHours: number;

  @IsNotEmpty({
    message:
      'Set Env variable USER_RECOVERY_PASSWORD_CONFIRMATION_EXPIRES_MIN to be number, example:[0-59]',
  })
  @IsNumber()
  public recoveryPasswordExpiresInMin: number;

  constructor(private configService: ConfigService<any, true>) {
    this.emailExpiresInHours = Number(
      this.configService.get('USER_EMAIL_CONFIRMATION_EXPIRES_HOURS'),
    );
    this.emailExpiresInMin = Number(
      this.configService.get('USER_EMAIL_CONFIRMATION_EXPIRES_MIN'),
    );

    this.recoveryPasswordExpiresInMin = Number(
      this.configService.get('USER_RECOVERY_PASSWORD_CONFIRMATION_EXPIRES_MIN'),
    );
    this.recoveryPasswordExpiresInHours = Number(
      this.configService.get(
        'USER_RECOVERY_PASSWORD_CONFIRMATION_EXPIRES_HOURS',
      ),
    );
    //::TODO протестить конфиг
    configValidationUtility.validateConfig(this);
  }
}
