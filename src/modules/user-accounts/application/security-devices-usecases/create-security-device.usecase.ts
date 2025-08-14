import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { SecurityDevice, SecurityDeviceModelType } from '../../domin/security-device.entity';
import { SecurityDeviceRepository } from '../../infrastructure/security-device.repository';

type CreateSecurityDeviceCmdType = {
  userId: string;
  deviceId: Types.ObjectId;
  ip: string;
  agent: string;
  lastActiveDate: Date;
  expirationDate: Date;
};

export class CreateSecurityDeviceCommand {
  readonly userId: string;
  readonly deviceId: Types.ObjectId;
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
    @InjectModel(SecurityDevice.name)
    private readonly securityDeviceModel: SecurityDeviceModelType,
    private readonly securityDeviceRepository: SecurityDeviceRepository,
  ) {}

  async execute(command: CreateSecurityDeviceCommand): Promise<void> {
    const device = this.securityDeviceModel.createInstance({
      ip: command.ip,
      title: command.agent,
      userId: command.userId,
      deviceId: command.deviceId,
      lastActiveDate: command.lastActiveDate,
      expirationDate: command.expirationDate,
    })
    await this.securityDeviceRepository.save(device);
  }
}
