import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SessionDeviceRepository } from '../../infrastructure/session-device.repository';

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
    private readonly sessionDeviceRepository: SessionDeviceRepository,
  ) {}

  async execute(command: DeleteDeviceByIdCommand): Promise<void> {
    const targetDevice = await this.sessionDeviceRepository.findByDeviceId(
      command.deviceId,
    );
    if (!targetDevice) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    if (targetDevice.user.id !== command.userId) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }

    await this.sessionDeviceRepository.deleteByDeviceIdByCurrentUserId(
      command.deviceId,
      command.userId,
    );
  }
}
