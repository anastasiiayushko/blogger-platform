import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { MulterError } from 'multer';

// type ErrorCode =
//   | 'LIMIT_PART_COUNT'
//   | 'LIMIT_FILE_SIZE'
//   | 'LIMIT_FILE_COUNT'
//   | 'LIMIT_FIELD_KEY'
//   | 'LIMIT_FIELD_VALUE'
//   | 'LIMIT_FIELD_COUNT'
//   | 'LIMIT_UNEXPECTED_FILE'
//   | 'MISSING_FIELD_NAME';

@Catch(MulterError, HttpException)
export class MulterExceptionFilter implements ExceptionFilter {
  readonly logger: Logger = new Logger(MulterExceptionFilter.name);
  catch(exception: MulterError | HttpException, host: ArgumentsHost): any {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const cause = exception.cause;
    // if (cause instanceof MulterError) {
    //   this.logger.log('Cause instanceof MulterError', cause);
    // }
    // if (exception instanceof HttpException) {
    //   this.logger.log('HttpExeption', exception.message, exception);
    // }
    // if (exception instanceof MulterError) {
    //   this.logger.log('MulterError', exception.message, exception);
    // }
    response.status(HttpStatus.BAD_REQUEST).json({
      timestamp: new Date().toISOString(),
      message: exception.message,
    });
  }
}
