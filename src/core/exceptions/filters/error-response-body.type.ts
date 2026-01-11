import { DomainExceptionCode } from '../domain-exception-codes';
import { ApiExtensionError } from '../domain-exception';
import { ApiProperty } from '@nestjs/swagger';

export type ErrorResponseBody = {
  timestamp: string;
  path: string | null;
  message: string;
  extensions: ApiExtensionError[];
  code: DomainExceptionCode;
};

class FieldError {
  @ApiProperty({ type: String })
  message: string;
  @ApiProperty({ type: String })
  field: string;
}

export class ApiErrorResult {
  @ApiProperty({ type: ()=> FieldError, isArray: true })
  errorMessages: FieldError[];
}
