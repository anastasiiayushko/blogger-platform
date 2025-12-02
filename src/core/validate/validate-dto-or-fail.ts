import { ValidationError } from '@nestjs/common';
import {
  ApiExtensionError,
  DomainException,
} from '../exceptions/domain-exception';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';
import { validate } from 'class-validator';

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

// export async function validateWithTransformDtoOrFail<T extends object>(
//   cls: new (...args: any[]) => T,
//   plain: unknown,
// ): Promise<T> {
//   //тут срабатывает @Transform
//   const dto = plainToInstance(cls, plain);
//
//   const errors = await validate(dto);
//
//   if (!errors.length) {
//     return dto;
//   }
//   const errorResponse = formatterError(errors);
//   throw new DomainException({
//     code: DomainExceptionCode.BadRequest,
//     extensions: errorResponse,
//     message: 'Validation failed',
//   });
// }

//::TODO насколько это валидное решение
export async function validateDtoOrFail(plain: object): Promise<void> {
  console.log('plain', plain);
  const errors = await validate(plain);
  console.log('validateDtoOrFail', errors);
  if (!errors.length) {
    return;
  }
  const errorResponse = formatterError(errors);
  throw new DomainException({
    code: DomainExceptionCode.BadRequest,
    extensions: errorResponse,
    message: 'Validation failed',
  });
}
