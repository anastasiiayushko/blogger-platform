import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { SecurityDeviceRepository } from '../../infrastructure/security-device.repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class AuthLogoutCommand {
  constructor(
    public deviceId: string,
    public userId: string,
  ) {}
}

@CommandHandler(AuthLogoutCommand)
export class AuthLogoutHandler implements ICommandHandler<AuthLogoutCommand> {
  constructor(
    private readonly securityDeviceRepository: SecurityDeviceRepository,
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
