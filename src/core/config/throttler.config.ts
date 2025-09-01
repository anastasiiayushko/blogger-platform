import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../setup/config-validation.utility';

@Injectable()
export class ThrottlerConfig {
  @IsNotEmpty({
    message: 'Set Env variable THROTTLE_ENABLED, example: true or  false',
  })
  enabled: boolean;

  @IsNotEmpty({
    message: 'Set Env variable THROTTLE_LIMIT, example:5',
  })
  limit: number;

  @IsNotEmpty({
    message: 'Set Env variable THROTTLE_TTL, example to time ms : 1000',
  })
  ttl: number;

  constructor(private configService: ConfigService) {
    this.enabled = configValidationUtility.convertToBoolean(
      String(this.configService.get<string>('THROTTLE_ENABLED')),
    );

    this.limit = configValidationUtility.convertToNumber(
      this.configService.get<number>('THROTTLE_LIMIT'),
    );

    this.ttl = configValidationUtility.convertToNumber(
      this.configService.get<number>('THROTTLE_TTL'),
    );

    configValidationUtility.validateConfig(this);
  }
}
