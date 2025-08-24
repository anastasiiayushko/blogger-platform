import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersSqlRepository } from '../../infrastructure/sql/users.sql-repository';
import { EmailConfirmationSqlRepository } from '../../infrastructure/sql/email-confirmation.sql-repository';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export class RegistrationConfirmationCommand {
  constructor(public code: string) {}
}

@CommandHandler(RegistrationConfirmationCommand)
export class RegistrationConfirmationCommandHandler
  implements ICommandHandler<RegistrationConfirmationCommand>
{
  constructor(
    protected userRepository: UsersSqlRepository,
    protected emailConfirmationRepository: EmailConfirmationSqlRepository,
  ) {}

  async execute(command: RegistrationConfirmationCommand): Promise<void> {
    const emailConfirmation = await this.emailConfirmationRepository.findByCode(
      command.code,
    );
    //::TODO нужно ли ходить и проверять есть ли сам пользователь в бд
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
