import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UserConfirmationConfig } from '../../config/user-confirmation.config';
import { EmailPasswordRecoveryEvent } from '../../../notifications/event-usecases/email-password-recovery.event-usecase';
import { UserRepository } from '../../infrastructure/user-repository';
import { PasswordRecoveryRepository } from '../../infrastructure/password-recovery.repository';
import { PasswordRecovery } from '../../domin/password-recovery.entity';

export class PasswordRecoveryCommand {
  constructor(public email: string) {}
}

@CommandHandler(PasswordRecoveryCommand)
export class PasswordRecoveryHandler
  implements ICommandHandler<PasswordRecoveryCommand>
{
  private expiresInHours: number;
  private expiresInMin: number;

  constructor(
    protected usersRepository: UserRepository,
    protected recoveryPasswordRepository: PasswordRecoveryRepository,
    protected userConfirmationConfig: UserConfirmationConfig,
    protected eventBus: EventBus,
  ) {
    this.expiresInHours = userConfirmationConfig.recoveryPasswordExpiresInHours;
    this.expiresInMin = userConfirmationConfig.recoveryPasswordExpiresInMin;
  }

  async execute(cmd: PasswordRecoveryCommand): Promise<void> {
    let recoveryCode: string;
    const user = await this.usersRepository.findByEmailOrLogin(cmd.email);

    if (!user) {
      return;
    }

    const recoveryExisting = await this.recoveryPasswordRepository.findByUserId(
      user.id as string,
    );

    const recovery = recoveryExisting
      ? recoveryExisting
      : PasswordRecovery.createInstance(user.id, {
          min: this.expiresInMin,
          hours: this.expiresInHours,
        });

    if (recoveryExisting) {
      recoveryExisting.regenerate({
        min: this.expiresInMin,
        hours: this.expiresInHours,
      });
    }

    await this.recoveryPasswordRepository.save(recovery);

    this.eventBus.publish(
      new EmailPasswordRecoveryEvent(user.email, recovery.code),
    );
  }
}
