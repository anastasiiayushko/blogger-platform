import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SessionDeviceSqlRepository } from '../../infrastructure/sql/session-device.sql-repository';

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
    this.userId = dto.userId;
    this.deviceId = dto.deviceId;
    this.ip = dto.ip;
    this.agent = dto.agent;
    this.lastActiveDate = dto.lastActiveDate;
    this.expirationDate = dto.expirationDate;
  }
}

@CommandHandler(UpdateSecurityDeviceCommand)
export class UpdateSecurityDeviceHandler
  implements ICommandHandler<UpdateSecurityDeviceCommand>
{
  constructor(
    private readonly sessionDeviceRepository: SessionDeviceSqlRepository,
  ) {}

  async execute(command: UpdateSecurityDeviceCommand): Promise<void> {
    const device = await this.sessionDeviceRepository.findDeviceByIdAndUserId(
      command.deviceId,
      command.userId,
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

    await this.sessionDeviceRepository.save(device);
  }
}
