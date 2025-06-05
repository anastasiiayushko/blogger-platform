import { DomainExceptionCode } from './domain-exception-codes';

export class ApiExtensionError {
  constructor(
    public message: string,
    public field: string,
  ) {}
}

export class DomainException extends Error {
  message: string;
  code: DomainExceptionCode;
  extensions: ApiExtensionError[];

  constructor(errorInfo: {
    code: DomainExceptionCode;
    message?: string;
    extensions?: ApiExtensionError[];
  }) {
    super(errorInfo.message);
    this.message = errorInfo?.message ?? '';
    this.code = errorInfo.code;
    this.extensions = errorInfo.extensions || [];
  }
}
