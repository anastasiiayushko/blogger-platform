import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SessionDeviceSqlRepository } from '../../infrastructure/sql/session-device.sql-repository';

export class TerminateAllOtherDevicesCommand {
  constructor(
    public deviceId: string,
    public userId: string,
  ) {}
}

@CommandHandler(TerminateAllOtherDevicesCommand)
export class TerminateAllOtherDevicesHandler
  implements ICommandHandler<TerminateAllOtherDevicesCommand>
{
  constructor(private sessionDeviceRepository: SessionDeviceSqlRepository) {}

  //::TODO почему нет проверки на существование сессии
  async execute(command: TerminateAllOtherDevicesCommand): Promise<void> {
    await this.sessionDeviceRepository.terminateAllOtherDevices(
      command.deviceId,
      command.userId,
    );
  }
}
