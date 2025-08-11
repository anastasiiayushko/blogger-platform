import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

type CreateSecurityDeviceProps = {
  userId: string;
  deviceId: string;
  ip: string;
  agent: string;
  createdAt: Date;
  expiresAt: Date;
};

export class CreateSecurityDeviceCommand {
  readonly userId: string;
  readonly deviceId: string;
  readonly ip: string;
  readonly agent: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;

  constructor(props: CreateSecurityDeviceProps) {
    Object.assign(this, props);
  }
}

@CommandHandler(CreateSecurityDeviceCommand)
export class CreateUserDeviceHandler implements ICommandHandler<CreateSecurityDeviceCommand> {
  async execute(command: CreateSecurityDeviceCommand) {}
}
