import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SessionDeviceSqlRepository } from '../../infrastructure/sql/session-device.sql-repository';

export class AuthLogoutCommand {
  constructor(
    public deviceId: string,
    public userId: string,
  ) {}
}

@CommandHandler(AuthLogoutCommand)
export class AuthLogoutHandler implements ICommandHandler<AuthLogoutCommand> {
  constructor(
    private readonly securityDeviceRepository: SessionDeviceSqlRepository,
  ) {}

  async execute({ deviceId, userId }: AuthLogoutCommand): Promise<void> {
    const device = await this.securityDeviceRepository.findDeviceByIdAndUserId(
      deviceId,
      userId,
    );
    if (!device) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    await this.securityDeviceRepository.deleteById(deviceId, userId);
  }
}
