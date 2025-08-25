import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from '../../constants/auth-tokens.inject-constants';
import { JwtService } from '@nestjs/jwt';
import { DateUtil } from '../../../../core/utils/DateUtil';
import { CreateSecurityDeviceCommand } from '../security-devices-usecases/create-security-device.usecase';
import { randomUUID } from 'crypto';

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
    protected commandBus: CommandBus,
  ) {}

  async execute(command: AuthLoginCommand): Promise<AuthLoginResponse> {
    const deviceId = randomUUID();
    const refreshToken = this.refreshTokenContext.sign({
      userId: command.userId,
      deviceId,
    });
    const decode = this.refreshTokenContext.decode(refreshToken);

    await this.commandBus.execute<CreateSecurityDeviceCommand>(
      new CreateSecurityDeviceCommand({
        deviceId: deviceId,
        agent: command.agent,
        ip: command.ip,
        userId: command.userId,
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
