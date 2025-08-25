import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionDeviceSqlRepository } from '../../infrastructure/sql/session-device.sql-repository';
import { SessionDevice } from '../../domin/sql-entity/session-device.sql-entity';

type CreateSecurityDeviceCmdType = {
  userId: string;
  deviceId: string;
  ip: string;
  agent: string;
  lastActiveDate: Date;
  expirationDate: Date;
};

export class CreateSecurityDeviceCommand {
  readonly userId: string;
  readonly deviceId: string;
  readonly ip: string;
  readonly agent: string;
  readonly lastActiveDate: Date;
  readonly expirationDate: Date;

  constructor(dto: CreateSecurityDeviceCmdType) {
    Object.assign(this, dto);
  }
}

@CommandHandler(CreateSecurityDeviceCommand)
export class CreateSecurityDeviceHandler
  implements ICommandHandler<CreateSecurityDeviceCommand>
{
  constructor(
    private readonly securityDeviceRepository: SessionDeviceSqlRepository,
  ) {}

  async execute(command: CreateSecurityDeviceCommand): Promise<void> {
    const device = SessionDevice.createInstance({
      ip: command.ip,
      title: command.agent,
      userId: command.userId,
      deviceId: command.deviceId,
      lastActiveDate: command.lastActiveDate,
      expirationDate: command.expirationDate,
    });
    await this.securityDeviceRepository.save(device);
  }
}
