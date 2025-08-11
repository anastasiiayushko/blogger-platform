import { Injectable } from '@nestjs/common';
import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
import { ConfigService } from '@nestjs/config';
import { configValidationUtility } from '../setup/config-validation.utility';

export enum Environments {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TESTING = 'testing',
}

@Injectable()
export class CoreConfig {
  @IsNumber(
    {},
    {
      message: 'Set Env variable PORT, example: 3000',
    },
  )
  port: number;

  @IsNotEmpty({
    message:
      'Set Env variable MONGO_URI, example: mongodb://localhost:27017/my-app-local-db',
  })
  mongoUrl: string;

  @IsEnum(Environments, {
    message:
      'Ser correct NODE_ENV value, available values: ' +
      configValidationUtility.getEnumValues(Environments).join(', '),
  })
  env: string;
  // @IsBoolean({
  //   message:
  //     'Set Env variable IS_SWAGGER_ENABLED to enable/disable Swagger, example: true, available values: true, false',
  // })
  // isSwaggerEnabled = configValidationUtility.convertToBoolean(
  //   this.configService.get('IS_SWAGGER_ENABLED'),
  // ) as boolean;
  // @IsBoolean({
  //   message:
  //     'Set Env variable INCLUDE_TESTING_MODULE to enable/disable Dangerous for production TestingModule, example: true, available values: true, false, 0, 1',
  // })
  // includeTestingModule: boolean = configValidationUtility.convertToBoolean(
  //   this.configService.get('INCLUDE_TESTING_MODULE'),
  // ) as boolean;

  // @IsBoolean({
  //   message:
  //     'Set Env variable SEND_INTERNAL_SERVER_ERROR_DETAILS to enable/disable Dangerous for production internal server error details (message, etc), example: true, available values: true, false, 0, 1',
  // })
  // sendInternalServerErrorDetails: boolean =
  //   configValidationUtility.convertToBoolean(
  //     this.configService.get('SEND_INTERNAL_SERVER_ERROR_DETAILS'),
  //   ) as boolean;

  constructor(private configService: ConfigService<any, true>) {
    this.port = Number(this.configService.get('PORT'));
    this.mongoUrl = this.configService.get('MONGODB_URI');
    this.env = this.configService.get('NODE_ENV');
    configValidationUtility.validateConfig(this);
  // }
  }
}
