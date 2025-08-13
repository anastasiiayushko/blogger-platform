import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { DateUtil } from '../../../../core/utils/DateUtil';
import { UpdateSecurityDeviceCommand } from '../security-devices-usecases/update-security-device.usecase';

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
    protected commandBus: CommandBus,
  ) {}

  async execute(
    command: AuthRefreshTokenCommand,
  ): Promise<AuthRefreshTokenResponse> {
    const refreshToken = this.refreshTokenContext.sign({
      userId: command.userId,
      deviceId: command.deviceId,
    });
    const decode = this.refreshTokenContext.decode(refreshToken);

    await this.commandBus.execute<UpdateSecurityDeviceCommand>(
      new UpdateSecurityDeviceCommand({
        userId: command.userId,
        deviceId: command.deviceId,
        ip: command.ip,
        agent: command.agent,
        lastActiveDate: DateUtil.convertUnixToUTC(decode.iat),
        expirationDate: DateUtil.convertUnixToUTC(decode.exp),
      }),
    );

    return {
      accessToken: this.accessTokenContext.sign({ userId: command.userId }),
      refreshToken: refreshToken,
    };
  }
}
