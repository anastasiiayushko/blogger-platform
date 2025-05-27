import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { isValidObjectId, Types } from 'mongoose';
import { DomainException } from '../exceptions/domain-exception';
import { DomainExceptionCode } from '../exceptions/domain-exception-codes';

@Injectable()
export class ObjectIdValidationTransformPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata): any {
    if (!isValidObjectId(value)) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `Invalid ObjectId ${value}`,
        extensions: [
          {
            field: metadata?.data ?? 'id',
            message: `Invalid ObjectId ${value}`,
          },
        ],
      });
    }
    const objectId = new Types.ObjectId(value);
    return objectId;
  }
}

@Injectable()
export class ObjectIdValidationPipe implements PipeTransform {
  transform(value: any): any {
    if (!isValidObjectId(value)) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: `Invalid ObjectId: ${value}`,
        extensions: [],
      });
    }

    return value;
  }
}
