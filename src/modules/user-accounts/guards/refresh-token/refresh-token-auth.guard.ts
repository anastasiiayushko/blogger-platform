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
import { DateUtil } from '../../../../core/utils/DateUtil';
import { SessionDeviceSqlRepository } from '../../infrastructure/sql/session-device.sql-repository';

type RefreshTokenPayloadTYpe = {
  deviceId: string;
  userId: string;
  iat: number;
  exp: number;
};

@Injectable()
export class RefreshTokenAuthGuard implements CanActivate {
  constructor(
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
    private sessionDeviceRepository: SessionDeviceSqlRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const refreshToken: string | null = request.cookies['refreshToken'] ?? null;

    if (!refreshToken) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      // response.clearCookie('refreshToken');
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    let refreshPayload: RefreshTokenPayloadTYpe;

    try {
      refreshPayload = await this.refreshTokenContext.verify(refreshToken);
    } catch (e: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.clearCookie('refreshToken');
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }

    const foundDeviceActual =
      await this.sessionDeviceRepository.findActualDevice(
        refreshPayload.deviceId,
        refreshPayload.userId,
        DateUtil.convertUnixToUTC(refreshPayload.iat),
      );

    if (!foundDeviceActual) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.clearCookie('refreshToken');
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    request.refreshTokenPayload = refreshPayload;

    return true;
  }
}
