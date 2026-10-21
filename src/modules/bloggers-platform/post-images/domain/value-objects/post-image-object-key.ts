import { randomUUID } from 'crypto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class PostImageObjectKey {
  private constructor() {}

  static create(postId: string, extension: string) {
    if (!postId || !extension) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: 'Invalid postId or extension',
      });
    }
    return `posts/${postId}/images/${randomUUID()}.${extension}`;
  }
}
