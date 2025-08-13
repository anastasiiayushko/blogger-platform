import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';

@Injectable()
export class UserAccountConfig {
  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET, example: secret',
  })
  assessTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable ASSESS_TOKEN_EXPIRES_IN, example: 1m, 1h, 1d',
  })
  assessTokenExpiresIn: string;

  @IsNotEmpty({
    message: 'Set Env variable JWT_REFRESH_SECRET, example: secret',
  })
  refreshTokenSecret: string;
  @IsNotEmpty({
    message: 'Set Env variable JWT_AT_EXPIRES, example: 1m, 1h, 1d',
  })
  refreshTokenExpiresIn: string;

  constructor(private configService: ConfigService) {
    this.assessTokenSecret = String(
      this.configService.get<string>('ACCESS_TOKEN_SECRET'),
    );
    this.assessTokenExpiresIn = String(
      this.configService.get<string>('ASSESS_TOKEN_EXPIRES_IN'),
    );

    this.refreshTokenSecret = String(
      this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    );
    this.refreshTokenExpiresIn = String(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
    );
    console.log('user-account.config.ts', this.refreshTokenSecret, '');
    configValidationUtility.validateConfig(this);
  }
}
