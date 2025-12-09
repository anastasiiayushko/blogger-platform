import { validate } from 'class-validator';
import { ValidationError } from '@nestjs/common';
import {
  ApiExtensionError,
  DomainException,
} from '../exceptions/domain-exception';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

export abstract class ValidatableCommand {
  async validateOrFail() {
    const errors = await validate(this, {
      whitelist: true,
      forbidUnknownValues: true,
    });

    if (errors.length) {
      // можешь использовать свой helper validateDtoOrFail
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: this.formatterError(errors),
        message: 'Validation failed',
      });
    }
  }

  formatterError(errors: ValidationError[]): ApiExtensionError[] {
    return errors.map((error) => {
      const message = Object.values(error?.constraints ?? {}).join(' ');
      const filedName = error.property;
      return {
        field: filedName,
        message: message,
      };
    });
  }
}
