import { DomainExceptionCode } from '../../../src/core/exceptions/domain-exception-codes';
import { DomainException } from '../../../src/core/exceptions/domain-exception';

export function assertValidateErrorDto(
  exeption: DomainException[] | DomainException,
  expected: {
    statusCode: DomainExceptionCode;
    firstFieldName?: string;
  },
) {
  if (Array.isArray(exeption)) {
    exeption.forEach((item) => {
      expect(item).toBeInstanceOf(DomainException);
      expect(item.code).toBe(expected.statusCode);
      if (expected.firstFieldName) {
        expect(item.extensions[0].field).toBe(expected.firstFieldName);
      }
    });
    return;
  }

  expect(exeption).toBeInstanceOf(DomainException);
  expect(exeption.code).toBe(expected.statusCode);
  if (expected.firstFieldName) {
    expect(exeption.extensions[0].field).toBe(expected.firstFieldName);
  }
}
