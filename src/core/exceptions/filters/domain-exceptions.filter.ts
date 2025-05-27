import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { DomainException } from '../domain-exception';
import { DomainExceptionCode } from '../domain-exception-codes';
import { ErrorResponseBody } from './error-response-body.type';
import { ConfigService } from '@nestjs/config';

@Catch(DomainException)
export class DomainExceptionsFilter implements ExceptionFilter {
  constructor(protected configService: ConfigService) {}
  catch(exception: DomainException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = this.mapToHttpStatus(exception.code);
    const { extensions, code, path, message, timestamp } =
      this.buildResponseBody(exception, request.url);

    const isProduction = this.configService.get('NODE_ENV') === 'production';

    if (Array.isArray(extensions) && extensions.length > 0) {
      response.status(status).json({
        errorMessages: extensions,
      });
      return;
    }

    if ([status].includes(HttpStatus.INTERNAL_SERVER_ERROR) && isProduction) {
      response.status(status).json({
        exception: extensions,
        code: code,
        path: path,
        message: message,
        timestamp: timestamp,
      });
      return;
    }
    const messageResponse = exception.message
      ? { message: exception.message }
      : {};
    response.status(status).json(messageResponse);
  }

  private mapToHttpStatus(code: DomainExceptionCode): number {
    switch (code) {
      case DomainExceptionCode.BadRequest:
      case DomainExceptionCode.ValidationError:
      case DomainExceptionCode.ConfirmationCodeExpired:
      case DomainExceptionCode.EmailNotConfirmed:
      case DomainExceptionCode.PasswordRecoveryCodeExpired:
        return HttpStatus.BAD_REQUEST;
      case DomainExceptionCode.Forbidden:
        return HttpStatus.FORBIDDEN;
      case DomainExceptionCode.NotFound:
        return HttpStatus.NOT_FOUND;
      case DomainExceptionCode.Unauthorized:
        return HttpStatus.UNAUTHORIZED;
      case DomainExceptionCode.InternalServerError:
        return HttpStatus.INTERNAL_SERVER_ERROR;
      default:
        return HttpStatus.I_AM_A_TEAPOT;
    }
  }

  private buildResponseBody(
    exception: DomainException,
    requestUrl: string,
  ): ErrorResponseBody {
    return {
      timestamp: new Date().toISOString(),
      path: requestUrl,
      message: exception.message,
      code: exception.code,
      extensions: exception.extensions,
    };
  }
}
