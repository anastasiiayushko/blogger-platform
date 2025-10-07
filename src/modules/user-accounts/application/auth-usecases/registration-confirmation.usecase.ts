import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { EmailConfirmationRepository } from '../../infrastructure/email-confirmation.repository';

export class RegistrationConfirmationCommand {
  constructor(public code: string) {}
}

@CommandHandler(RegistrationConfirmationCommand)
export class RegistrationConfirmationCommandHandler
  implements ICommandHandler<RegistrationConfirmationCommand>
{
  constructor(
    protected emailConfirmationRepository: EmailConfirmationRepository,
  ) {}

  async execute(command: RegistrationConfirmationCommand): Promise<void> {
    const emailConfirmation = await this.emailConfirmationRepository.findByCode(
      command.code,
    );
    if (
      !emailConfirmation ||
      emailConfirmation.isConfirmed ||
      emailConfirmation.isExpired()
    ) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          { field: 'code', message: 'Confirmation Code is invalid' },
        ],
      });
    }
    emailConfirmation.confirm();
    await this.emailConfirmationRepository.save(emailConfirmation);
  }
}
