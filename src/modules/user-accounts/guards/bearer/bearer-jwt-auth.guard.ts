import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { IS_PUBLIC_KEY } from '../decorators/public.decorators';
import { Reflector } from '@nestjs/core';

@Injectable()
export class BearerJwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
  // canActivate(context: ExecutionContext) {
  //   return super.canActivate(context);
  // }
  canActivate(context: ExecutionContext) {
    // Check if the handler or class is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true; // Bypasses the authentication logic
    }

    // Otherwise, run the default authentication logic (e.g., JWT validation)
    return super.canActivate(context);
  }
  handleRequest(err: any, user: any): any {
    if (err || !user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    return user;
  }
}
