import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { UserConfirmationConfig } from '../../config/user-confirmation.config';
import { EmailConfirmationSqlRepository } from '../../infrastructure/sql/email-confirmation.sql-repository';
import { EmailConfirmRegistrationEvent } from '../../../notifications/event-usecases/email-confirm-registration.event-usecase';
import { UsersSqlRepository } from '../../infrastructure/sql/users.sql-repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class RegistrationEmailResendingCommand {
  constructor(public email: string) {}
}

@CommandHandler(RegistrationEmailResendingCommand)
export class RegistrationEmailResendingHandler
  implements ICommandHandler<RegistrationEmailResendingCommand, void>
{
  constructor(
    protected userConfirmationConfig: UserConfirmationConfig,
    protected userRepository: UsersSqlRepository,
    protected emailConfirmationRepository: EmailConfirmationSqlRepository,
    protected eventBus: EventBus,
  ) {}

  async execute(cmd: RegistrationEmailResendingCommand): Promise<void> {
    const user = await this.userRepository.findByEmailOrLogin(cmd.email);

    const emailConfirmation = user
      ? await this.emailConfirmationRepository.findByUserId(user?.id as string)
      : null;

    if (!user || !emailConfirmation || emailConfirmation.isConfirmed) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          {
            field: 'email',
            message:
              'If your email exists and is not confirmed, a confirmation message will be sent',
          },
        ],
      });
    }
    emailConfirmation.regenerate({
      hours: this.userConfirmationConfig.emailExpiresInHours,
      min: this.userConfirmationConfig.emailExpiresInMin,
    });

    await this.emailConfirmationRepository.save(emailConfirmation);

    this.eventBus.publish(
      new EmailConfirmRegistrationEvent(cmd.email, emailConfirmation.code),
    );
    return;
  }
}
