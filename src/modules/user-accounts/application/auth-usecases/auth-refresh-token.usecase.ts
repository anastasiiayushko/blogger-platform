import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { DateUtil } from '../../../../core/utils/DateUtil';
import { SessionDeviceRepository } from '../../infrastructure/session-device.repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

type AuthRefreshTokenCmdType = {
  deviceId: string;
  userId: string;
  ip: string;
  agent: string;
};
type AuthRefreshTokenResponse = {
  accessToken: string;
  refreshToken: string;
};

export class AuthRefreshTokenCommand {
  readonly deviceId: string;
  readonly userId: string;
  readonly ip: string;
  readonly agent: string;

  constructor(cmd: AuthRefreshTokenCmdType) {
    Object.assign(this, cmd);
  }
}

@CommandHandler(AuthRefreshTokenCommand)
export class AuthRefreshTokenHandler
  implements ICommandHandler<AuthRefreshTokenCmdType, AuthRefreshTokenResponse>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
    private sessionDeviceRepository: SessionDeviceRepository,
  ) {}

  async execute(
    command: AuthRefreshTokenCommand,
  ): Promise<AuthRefreshTokenResponse> {
    const targetDevice =
      await this.sessionDeviceRepository.findByDeviceAndUserIds(
        command.deviceId,
        command.userId,
      );

    if (!targetDevice) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }

    const newRefreshToken = await this.refreshTokenContext.signAsync({
      userId: command.userId,
      deviceId: command.deviceId,
    });

    const decode = this.refreshTokenContext.decode<{
      iat: number;
      exp: number;
    }>(newRefreshToken);

    targetDevice.updateDevice({
      ip: command.ip,
      title: command.agent,
      lastActiveAt: DateUtil.convertUnixToUTC(decode.iat),
      expirationAt: DateUtil.convertUnixToUTC(decode.exp),
    });

    await this.sessionDeviceRepository.save(targetDevice);

    return {
      accessToken: this.accessTokenContext.sign({ userId: command.userId }),
      refreshToken: newRefreshToken,
    };
  }
}
