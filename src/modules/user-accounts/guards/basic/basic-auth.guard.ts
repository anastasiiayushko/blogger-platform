import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Request } from 'express';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class BasicAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.match(/^Basic /i)) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    const decode = Buffer.from(authHeader.split(' ')?.[1], 'base64').toString(
      'utf-8',
    );
    const [username, password] = decode.split(':');
    if (username !== 'admin' || password !== 'qwerty') {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }

    return true;
  }
}
