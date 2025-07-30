import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { use } from 'passport';

@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {
  handleRequest(
    err: any,
    user: any,
    info: any,
    context: ExecutionContext,
    status?: any,
  ): any {
    if (err || !user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    return user;
  }
}
