import { Injectable } from '@nestjs/common';
import { IsNotEmpty, IsNumber } from 'class-validator';
import { configValidationUtility } from '../../setup/config-validation.utility';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class DatabaseConfig {
  @IsNotEmpty({
    message: 'Set Env variable PG_DATABASE_HOST, example: localhost',
  })
  host: string;

  @IsNumber(
    {},
    {
      message: 'Set Env variable PG_DATABASE_PORT, example: 5432',
    },
  )
  port: number;

  @IsNotEmpty({
    message: 'Set Env variable PG_DATABASE_NAME, example: DataBaseName',
  })
  database: string;

  @IsNotEmpty({
    message: 'Set Env variable PG_DATABASE_USERNAME, example: postgres',
  })
  username: string;

  @IsNotEmpty({
    message: 'Set Env variable PG_DATABASE_PASS, example: somePassword',
  })
  password: string;

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
    this.port = configValidationUtility.convertToNumber(
      this.configService.get('PG_DATABASE_PORT'),
    );
    this.host = this.configService.get('PG_DATABASE_HOST');
    this.database = this.configService.get('PG_DATABASE_NAME');
    this.username = this.configService.get('PG_DATABASE_USERNAME');
    this.password = this.configService.get('PG_DATABASE_PASS');
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
