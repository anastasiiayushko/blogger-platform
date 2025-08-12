import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { InjectModel } from '@nestjs/mongoose';
import {
  SecurityDevice,
  SecurityDeviceModelType,
} from '../../domin/security-device.entity';
import { SecurityDeviceRepository } from '../../infrastructure/security-device.repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

type CreateSecurityDeviceCmdType = {
  userId: string;
  deviceId: string;
  ip: string;
  agent: string;
  lastActiveDate: Date;
  expirationDate: Date;
};

export class UpdateSecurityDeviceCommand {
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

@CommandHandler(UpdateSecurityDeviceCommand)
export class UpdateSecurityDeviceHandler
  implements ICommandHandler<UpdateSecurityDeviceCommand>
{
  constructor(
    @InjectModel(SecurityDevice.name)
    private readonly securityDeviceModel: SecurityDeviceModelType,
    private readonly securityDeviceRepository: SecurityDeviceRepository,
  ) {}

  async execute(command: UpdateSecurityDeviceCommand): Promise<void> {
    const device = await this.securityDeviceRepository.findActualDevice(
      command.deviceId,
      command.userId,
      command.lastActiveDate,
    );

    if (!device) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }

    device.updateDevice({
      ip: command.ip,
      title: command.agent,
      lastActiveDate: command.lastActiveDate,
      expirationDate: command.expirationDate,
    });

    await this.securityDeviceRepository.save(device);
  }
}
