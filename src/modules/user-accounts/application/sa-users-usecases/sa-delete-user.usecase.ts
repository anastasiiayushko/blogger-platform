import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationSqlRepository } from '../../infrastructure/sql/email-confirmation.sql-repository';
import { UsersSqlRepository } from '../../infrastructure/sql/users.sql-repository';
import { PasswordRecoverySqlRepository } from '../../infrastructure/sql/password-recovery.sql-repository';

export class SaDeleteUserCommand {
  constructor(public userId: string) {}
}

@CommandHandler(SaDeleteUserCommand)
export class SaDeleteUserHandler
  implements ICommandHandler<SaDeleteUserCommand>
{
  constructor(
    protected userSqlRepository: UsersSqlRepository,
    protected emailConfirmationRepository: EmailConfirmationSqlRepository,
    protected passwordRecoverySqlRepository: PasswordRecoverySqlRepository,
  ) {}

  async execute({ userId }: SaDeleteUserCommand): Promise<void> {
    //::TODO добавить удаление строки recovery code
    await this.emailConfirmationRepository.deleteByUserId(userId);
    await this.passwordRecoverySqlRepository.deleteByUserId(userId);
    this.userSqlRepository.delete(userId);
  }
}
