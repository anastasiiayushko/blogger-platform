import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { SessionDeviceRepository } from '../../infrastructure/session-device.repository';

export class AuthLogoutCommand {
  constructor(
    public deviceId: string,
    public userId: string,
  ) {}
}

@CommandHandler(AuthLogoutCommand)
export class AuthLogoutHandler implements ICommandHandler<AuthLogoutCommand> {
  constructor(
    private readonly securityDeviceRepository: SessionDeviceRepository,
  ) {}

  async execute({ deviceId, userId }: AuthLogoutCommand): Promise<void> {
    const targetDevice =
      await this.securityDeviceRepository.findByDeviceAndUserIds(
        deviceId,
        userId,
      );
    if (!targetDevice) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    await this.securityDeviceRepository.deleteByDeviceIdByCurrentUserId(
      deviceId,
      userId,
    );
  }
}
