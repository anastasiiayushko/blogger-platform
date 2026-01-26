import {
  INestApplication,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiExtensionError,
  DomainException,
} from '../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../core/exceptions/domain-exception-codes';

function formatterError(errors: ValidationError[]): ApiExtensionError[] {
  return errors.map((error) => {
    const message = Object.values(error?.constraints ?? {}).join(' ');
    const filedName = error.property;
    return {
      field: filedName,
      message: message,
    };
  });
}

export function pipesSetup(app: INestApplication) {
  //Глобальный пайп для валидации и трансформации входящих данных.

  app.useGlobalPipes(
    new ValidationPipe({
      //class-transformer создает экземпляр dto
      //соответственно применятся значения по-умолчанию
      //и методы классов dto
      transform: true,
      //Выдавать первую ошибку для каждого поля
      stopAtFirstError: true,
      //Очищать все свойства, которых нет в DTO
      // whitelist: true,
      //не просто очищает лишние поля, а ещё выкидывает ошибку, если кто-то пытается прислать что-то лишнее приведёт к ошибке 400
      //forbidNonWhitelisted: true
      exceptionFactory: (errors) => {
        const errorResponse = formatterError(errors);
        // Логируем подробности в консоль
        console.log('Validation errors:', JSON.stringify(errors, null, 2));

        throw new DomainException({
          code: DomainExceptionCode.BadRequest,
          extensions: errorResponse,
          message: 'Validation failed',
        });
      },
    }),
  );
}
