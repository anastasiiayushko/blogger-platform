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
import { SecurityDeviceRepository } from '../../infrastructure/security-device.repository';
import { DateUtil } from '../../../../core/utils/DateUtil';

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
    private securityDeviceRepository: SecurityDeviceRepository,
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
    } catch (e: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.clearCookie('refreshToken');
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }

console.log('date,',  DateUtil.convertUnixToUTC(refreshPayload.iat))

    const foundDeviceActual =
      await this.securityDeviceRepository.findActualDevice(
        refreshPayload.deviceId,
        refreshPayload.userId,
        DateUtil.convertUnixToUTC(refreshPayload.iat),
      );

    console.log("foundDeviceActual:", foundDeviceActual);

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
