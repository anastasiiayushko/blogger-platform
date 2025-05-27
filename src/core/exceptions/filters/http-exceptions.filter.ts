import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionsFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    // const request = ctx.getRequest<Request>();
    //Если сработал этот фильтр, то пользователю улетит 500я ошибка

    const responseBody = exception.getResponse() as {
      statusCode: number;
      message: unknown;
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Internal Server Error',
      });
      return;
    }
    let error = {};
    // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
    if (status === HttpStatus.BAD_REQUEST) {
      error = {
        errorsMessages: responseBody.message,
      };
    } else {
      error = {
        message: responseBody.message,
      };
    }
    response.status(status).json({
      ...error,
    });
  }
}
