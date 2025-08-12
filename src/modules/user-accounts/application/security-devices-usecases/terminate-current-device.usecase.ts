import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityDeviceRepository } from '../../infrastructure/security-device.repository';

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
  constructor(private securityDeviceRepository: SecurityDeviceRepository) {}

  //::TODO почему нет проверки на существование сессии
  async execute(command: TerminateAllOtherDevicesCommand): Promise<void> {
    await this.securityDeviceRepository.terminateAllOtherDevices(
      command.deviceId,
      command.userId,
    );
  }
}
