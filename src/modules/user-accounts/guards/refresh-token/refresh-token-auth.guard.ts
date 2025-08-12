import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { REFRESH_TOKEN_STRATEGY_INJECT_TOKEN } from '../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class RefreshTokenAuthGuard implements CanActivate {
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const refreshToken = request.cookies['refreshToken'];
    if (!refreshToken) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    try {
      const refreshPayload =
        await this.refreshTokenContext.verify(refreshToken);
      console.log('refreshPayload', refreshPayload);
      request.refreshTokenPayload = refreshPayload;

      return true;
    } catch (e) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
  }
}
