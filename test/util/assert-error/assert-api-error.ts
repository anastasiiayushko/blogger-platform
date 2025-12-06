import { DomainExceptionCode } from '../../../src/core/exceptions/domain-exception-codes';
import { DomainException } from '../../../src/core/exceptions/domain-exception';
import { HttpStatus } from '@nestjs/common';
import { ApiErrorResultType } from '../../e2e/type/response-super-test';

export function assertApiError(
  error: ApiErrorResultType,
  status: HttpStatus,
  expected: {
    statusCode: HttpStatus;
    firstFieldName?: string;
  },
) {
  expect(status).toBe(expected.statusCode);
  expect(error.errorsMessages).toBeDefined();
  expect(error.errorsMessages[0]).toEqual({
    field: expected.firstFieldName,
    message: expect.any(String),
  });
}
