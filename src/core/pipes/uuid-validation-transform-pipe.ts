import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { DomainException } from '../exceptions/domain-exception';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';
import { isUUID } from 'class-validator';

@Injectable()
export class UuidValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): string {
    if (!isUUID(value)) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `Invalid uuid  ${value}`,
        extensions: [
          {
            field: metadata?.data ?? 'id',
            message: `Invalid uuid ${value}`,
          },
        ],
      });
    }
    return (value as string).trim();
  }
}
