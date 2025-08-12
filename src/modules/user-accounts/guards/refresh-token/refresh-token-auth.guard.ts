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
    const response = context.switchToHttp().getResponse();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const refreshToken: string | null = request.cookies['refreshToken'] ?? null;

    if (!refreshToken) {
      response.clearCookie('refreshToken');

      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const refreshPayload =
        await this.refreshTokenContext.verify(refreshToken);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      request.refreshTokenPayload = refreshPayload;

      return true;
    } catch (e: unknown) {
      response.clearCookie('refreshToken');
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
  }
}
