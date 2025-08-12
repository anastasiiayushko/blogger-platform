import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityDeviceRepository } from '../../infrastructure/security-device.repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Types } from 'mongoose';

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
    private readonly securityDeviceRepository: SecurityDeviceRepository,
  ) {}

  async execute(command: DeleteDeviceByIdCommand): Promise<void> {
    const foundDevice = await this.securityDeviceRepository.findDeviceById(
      command.deviceId,
    );
    if (!foundDevice) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    if (!foundDevice.userId.equals(new Types.ObjectId(command.userId))) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }

    await this.securityDeviceRepository.deleteById(
      command.deviceId,
      command.userId,
    );
  }
}
