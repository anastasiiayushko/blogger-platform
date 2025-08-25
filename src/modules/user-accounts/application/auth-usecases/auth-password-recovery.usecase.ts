import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UsersSqlRepository } from '../../infrastructure/sql/users.sql-repository';
import { PasswordRecoverySqlRepository } from '../../infrastructure/sql/password-recovery.sql-repository';
import { PasswordRecovery } from '../../domin/sql-entity/password-recovery.sql-entity';
import { UserConfirmationConfig } from '../../config/user-confirmation.config';
import { EmailPasswordRecoveryEvent } from '../../../notifications/event-usecases/email-password-recovery.event-usecase';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryHandler
  implements ICommandHandler<PasswordRecoveryCommand>
{
  constructor(
    protected usersRepository: UsersSqlRepository,
    protected recoveryPasswordRepository: PasswordRecoverySqlRepository,
    protected userConfirmationConfig: UserConfirmationConfig,
    protected eventBus: EventBus,
  ) {}

  async execute(cmd: PasswordRecoveryCommand): Promise<void> {
    const user = await this.usersRepository.findByEmailOrLogin(cmd.email);

    if (!user) {
      return;
    }
    const recoveryExisting = await this.recoveryPasswordRepository.findByUserId(
      user.id as string,
    );

    const recovery = recoveryExisting
      ? recoveryExisting
      : PasswordRecovery.createInstance(user.id as string, {
          hours: this.userConfirmationConfig.recoveryPasswordExpiresInHours,
          min: this.userConfirmationConfig.recoveryPasswordExpiresInMin,
        });

    if (recovery.id) {
      recovery.regenerate({
        hours: this.userConfirmationConfig.recoveryPasswordExpiresInHours,
        min: this.userConfirmationConfig.recoveryPasswordExpiresInMin,
      });
    }

    await this.recoveryPasswordRepository.save(recovery);

    this.eventBus.publish(
      new EmailPasswordRecoveryEvent(user.email, recovery.code),
    );
  }
}
