import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UserRepository } from '../../infrastructure/user-repository';

export class SaDeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(SaDeleteUserCommand)
export class SaDeleteUserHandler
  implements ICommandHandler<SaDeleteUserCommand>
{
  constructor(
    protected userRepository: UserRepository,
    // protected passwordRecoverySqlRepository: PasswordRecoverySqlRepository,
    // protected sessionDeviceRepository: SessionDeviceSqlRepository,
  ) {}

  async execute({ userId }: SaDeleteUserCommand): Promise<void> {
    //::TODO добавить удаление строки recovery code
    // await this.sessionDeviceRepository.deleteAllSessionByUserId(userId);
    // await this.emailConfirmationRepository.deleteByUserId(userId);
    // await this.passwordRecoverySqlRepository.deleteByUserId(userId);
    await this.userRepository.softDelete(userId);
    return;
  }
}
