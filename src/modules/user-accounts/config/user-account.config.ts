import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../../setup/config-validation.utility';

@Injectable()
export class UserAccountConfig {
  @IsNotEmpty({ message: 'Set Env variable JWT_AT_SECRET, example: secret' })
  jwtAccessSecret: string;

  @IsNotEmpty({
    message: 'Set Env variable JWT_AT_EXPIRES, example: 1m, 1h, 1d',
  })
  jwtAccessExpiresIn: string;

  @IsNotEmpty({
    message: 'Set Env variable JWT_REFRESH_SECRET, example: secret',
  })
  jwtRefreshSecret: string;
  @IsNotEmpty({
    message: 'Set Env variable JWT_AT_EXPIRES, example: 1m, 1h, 1d',
  })
  jwtRefreshExpiresIn: string;

  constructor(private configService: ConfigService) {
    this.jwtAccessSecret = String(
      this.configService.get<string>('JWT_AT_SECRET'),
    );
    this.jwtAccessExpiresIn = String(
      this.configService.get<string>('JWT_AT_EXPIRES'),
    );

    this.jwtRefreshSecret = String(
      this.configService.get<string>('JWT_RT_SECRET'),
    );
    this.jwtRefreshExpiresIn = String(
      this.configService.get<string>('JWT_RT_EXPIRES'),
    );
    configValidationUtility.validateConfig(this);
  }
}
