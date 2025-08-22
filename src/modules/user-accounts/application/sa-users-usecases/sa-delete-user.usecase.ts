import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EmailConfirmationSqlRepository } from '../../infrastructure/sql/email-confirmation.sql-repository';
import { UsersSqlRepository } from '../../infrastructure/sql/users.sql-repository';

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
  ) {}

  async execute({ userId }: SaDeleteUserCommand): Promise<void> {
    //::TODO добавить удаление строки recovery code
    await this.emailConfirmationRepository.deleteByUserId(userId);
    await this.userSqlRepository.delete(userId);
  }
}
