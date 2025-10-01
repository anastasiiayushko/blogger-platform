import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationSqlRepository } from '../../infrastructure/sql/email-confirmation.sql-repository';
import { PasswordRecoverySqlRepository } from '../../infrastructure/sql/password-recovery.sql-repository';
import { SessionDeviceSqlRepository } from '../../infrastructure/sql/session-device.sql-repository';
import { UserRepository } from '../../infrastructure/user-repository';

export class SaDeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(SaDeleteUserCommand)
export class SaDeleteUserHandler
  implements ICommandHandler<SaDeleteUserCommand>
{
  constructor(
    protected userSqlRepository: UserRepository,
    protected emailConfirmationRepository: EmailConfirmationSqlRepository,
    protected passwordRecoverySqlRepository: PasswordRecoverySqlRepository,
    protected sessionDeviceRepository: SessionDeviceSqlRepository,
  ) {}

  async execute({ userId }: SaDeleteUserCommand): Promise<void> {
    //::TODO добавить удаление строки recovery code
    // await this.sessionDeviceRepository.deleteAllSessionByUserId(userId);
    // await this.emailConfirmationRepository.deleteByUserId(userId);
    // await this.passwordRecoverySqlRepository.deleteByUserId(userId);
    await this.userSqlRepository.softDelete(userId);
    return;
  }
}
