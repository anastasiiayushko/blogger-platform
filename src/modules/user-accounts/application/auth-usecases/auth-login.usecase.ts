import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { DateUtil } from '../../../../core/utils/DateUtil';
import { randomUUID } from 'crypto';
import { SessionDeviceRepository } from '../../infrastructure/session-device.repository';
import { SessionDevice } from '../../domin/session-device.entity';

export class AuthLoginCommand {
  constructor(
    public readonly userId: string,
    public readonly ip: string,
    public readonly agent: string,
  ) {}
}

type AuthLoginResponse = {
  accessToken: string;
  refreshToken: string;
};

@CommandHandler(AuthLoginCommand)
export class AuthLoginHandler
  implements ICommandHandler<AuthLoginCommand, AuthLoginResponse>
{
  constructor(
    @Inject(ACCESS_TOKEN_STRATEGY_INJECT_TOKEN)
    private accessTokenContext: JwtService,
    @Inject(REFRESH_TOKEN_STRATEGY_INJECT_TOKEN)
    private refreshTokenContext: JwtService,
    private readonly securityDeviceRepository: SessionDeviceRepository,
  ) {}

  async execute(command: AuthLoginCommand): Promise<AuthLoginResponse> {
    const deviceId = randomUUID();

    const refreshToken = this.refreshTokenContext.sign({
      userId: command.userId,
      deviceId,
    });
    const decode = this.refreshTokenContext.decode<{
      iat: number;
      exp: number;
    }>(refreshToken);

    const sessionDevice = SessionDevice.createInstance({
      id: deviceId,
      ip: command.ip,
      userId: command.userId,
      title: command.agent,
      lastActiveAt: DateUtil.convertUnixToUTC(decode.iat),
      expirationAt: DateUtil.convertUnixToUTC(decode.exp),
    });

    await this.securityDeviceRepository.save(sessionDevice);

    return {
      accessToken: this.accessTokenContext.sign({ userId: command.userId }),
      refreshToken: refreshToken,
    };
  }
}
