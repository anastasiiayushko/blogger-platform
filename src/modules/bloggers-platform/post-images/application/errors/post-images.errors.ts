import {
  ApiExtensionError,
  DomainException,
} from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class PostImageUploadError extends DomainException {
  constructor(message?: string, extensions?: ApiExtensionError[]) {
    super({
      code: DomainExceptionCode.BadRequest,
      message,
      extensions,
    });
  }
}

export class PostImageStateConflictException extends DomainException {
  constructor(message?: string, extensions?: ApiExtensionError[]) {
    super({
      code: DomainExceptionCode.InternalServerError,
      message,
      extensions,
    });
  }
}

export class PostImageConstraintCountUpload extends DomainException {
  constructor(message?: string, extensions?: ApiExtensionError[]) {
    super({
      code: DomainExceptionCode.BadRequest,
      message,
      extensions,
    });
  }
}
