import { DomainExceptionCode } from '../domain-exception-codes';
import { ApiExtensionError } from '../domain-exception';

export type ErrorResponseBody = {
  timestamp: string;
  path: string | null;
  message: string;
  extensions: ApiExtensionError[];
  code: DomainExceptionCode;
};

class FieldError {
  message: string;
  field: string;
}

export class ApiErrorResult {
  errorMessages: FieldError[];
}
