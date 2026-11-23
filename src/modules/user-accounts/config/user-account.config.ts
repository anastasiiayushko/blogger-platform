import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JwtSignOptions } from '@nestjs/jwt';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';

type TokenExpiresIn = Extract<JwtSignOptions['expiresIn'], string>;

@Injectable()
export class UserAccountConfig {
  @IsNotEmpty({
    message: 'Set Env variable ACCESS_TOKEN_SECRET, example: secret',
  })
  assessTokenSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable ASSESS_TOKEN_EXPIRES_IN, example: 1m, 1h, 1d',
  })
  assessTokenExpiresIn: TokenExpiresIn;

  @IsNotEmpty({
    message: 'Set Env variable JWT_REFRESH_SECRET, example: secret',
  })
  refreshTokenSecret: string;
  @IsNotEmpty({
    message: 'Set Env variable JWT_AT_EXPIRES, example: 1m, 1h, 1d',
  })
  refreshTokenExpiresIn: TokenExpiresIn;

  constructor(private configService: ConfigService) {
    this.assessTokenSecret = String(
      this.configService.get<string>('ACCESS_TOKEN_SECRET'),
    );
    this.assessTokenExpiresIn = String(
      this.configService.get<string>('ASSESS_TOKEN_EXPIRES_IN'),
    ) as TokenExpiresIn;

    this.refreshTokenSecret = String(
      this.configService.get<string>('REFRESH_TOKEN_SECRET'),
    );
    this.refreshTokenExpiresIn = String(
      this.configService.get<string>('REFRESH_TOKEN_EXPIRES_IN'),
    ) as TokenExpiresIn;
    configValidationUtility.validateConfig(this);
  }
}
