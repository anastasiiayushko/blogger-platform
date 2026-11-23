import { Injectable } from '@nestjs/common';
import { IsNotEmpty } from 'class-validator';
import { configValidationUtility } from '../../setup/config-validation.utility';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig {
  @IsNotEmpty({
    message: 'Set Env variable DATABASE_URL',
  })
  url: string;

  @IsNotEmpty({
    message: 'Set Env variable PG_DATABASE_SYN, example: false',
  })
  synchronize: boolean;

  @IsNotEmpty({
    message: 'Set Env variable PG_DATABASE_AUTOLOAD_ENTITY, example: false',
  })
  autoLoadEntities: boolean;

  @IsNotEmpty({
    message: 'Set Env variable PG_DATABASE_LOGGING, example: false',
  })
  logging: boolean;

  constructor(private configService: ConfigService<any, true>) {
    this.url = this.configService.get('DATABASE_URL');
    this.synchronize = configValidationUtility.convertToBoolean(
      this.configService.get('PG_DATABASE_SYN'),
    );
    this.autoLoadEntities = configValidationUtility.convertToBoolean(
      this.configService.get('PG_DATABASE_AUTOLOAD_ENTITY'),
    );
    this.logging = configValidationUtility.convertToBoolean(
      this.configService.get('PG_DATABASE_LOGGING'),
    );
    configValidationUtility.validateConfig(this);
  }
}
