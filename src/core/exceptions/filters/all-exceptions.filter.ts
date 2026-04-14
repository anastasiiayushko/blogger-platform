import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseBody } from './error-response-body.type';
import { DomainExceptionCode } from '../domain-exception-codes';
import { ConfigService } from '@nestjs/config';
import * as process from 'node:process';
import { ValidationError } from 'class-validator';
import { ApiExtensionError } from '../domain-exception';
import { AppLoggerService } from '../../logger/app-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(
    protected configService: ConfigService,
    private readonly logger: AppLoggerService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    let message = 'Unknown exception occurred.';

    if (exception instanceof Error) {
      message = exception.message + exception.stack;
      this.logger.error(exception.message, exception.stack, 'AllExceptionsFilter');
      if (process.env.NODE_ENV !== 'production') {
        console.log(message);
      }
    } else {
      this.logger.error(String(message), undefined, 'AllExceptionsFilter');
    }

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const responseBody = this.buildResponseBody(request.url, message);

    response.status(status).json(responseBody);
  }

  private buildResponseBody(
    requestUrl: string,
    message: string,
  ): ErrorResponseBody {
    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';
    if (isProduction) {
      return {
        timestamp: new Date().toISOString(),
        path: null,
        message: 'Some error occurred',
        extensions: [],
        code: DomainExceptionCode.InternalServerError,
      };
    }

    return {
      timestamp: new Date().toISOString(),
      path: requestUrl,
      message,
      extensions: [],
      code: DomainExceptionCode.InternalServerError,
    };
  }
}
