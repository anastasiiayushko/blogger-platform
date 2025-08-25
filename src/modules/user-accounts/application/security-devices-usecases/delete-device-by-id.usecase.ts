import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SessionDeviceSqlRepository } from '../../infrastructure/sql/session-device.sql-repository';

export class DeleteDeviceByIdCommand {
  constructor(
    public deviceId: string,
    public userId: string,
  ) {}
}

@CommandHandler(DeleteDeviceByIdCommand)
export class DeleteDeviceByIdHandler
  implements ICommandHandler<DeleteDeviceByIdCommand>
{
  constructor(
    private readonly sessionDeviceRepository: SessionDeviceSqlRepository,
  ) {}

  async execute(command: DeleteDeviceByIdCommand): Promise<void> {
    const foundDevice = await this.sessionDeviceRepository.findByDeviceId(
      command.deviceId,
    );
    if (!foundDevice) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    if (foundDevice.userId !== command.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }

    await this.sessionDeviceRepository.deleteById(
      command.deviceId,
      command.userId,
    );
  }
}
