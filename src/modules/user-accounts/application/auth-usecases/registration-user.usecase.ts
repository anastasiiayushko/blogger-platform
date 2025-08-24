import { CreateUsersInputDto } from '../../api/input-dto/create-users.input-dto';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserService } from '../create-user-service';
import { UserConfirmationConfig } from '../../config/user-confirmation.config';
import { EmailConfirmationSqlRepository } from '../../infrastructure/sql/email-confirmation.sql-repository';
import { EmailConfirmation } from '../../domin/sql-entity/email-confirmation.sql-entity';
import { EmailConfirmRegistrationEvent } from '../../../notifications/event-usecases/email-confirm-registration.event-usecase';

export class RegistrationUserCommand {
  login: string;
  email: string;
  password: string;

  constructor(dto: CreateUsersInputDto) {
    this.login = dto.login;
    this.email = dto.email;
    this.password = dto.password;
  }
}

@CommandHandler(RegistrationUserCommand)
export class RegistrationUserHandler
  implements ICommandHandler<RegistrationUserCommand, void>
{
  constructor(
    protected createUserService: CreateUserService,
    protected userConfirmationConfig: UserConfirmationConfig,
    protected emailConfirmationRepository: EmailConfirmationSqlRepository,
    protected eventBus: EventBus,
  ) {}

  async execute(cmd: RegistrationUserCommand): Promise<void> {
    const userId = await this.createUserService.createUserEntity(cmd);
    const emailConfirmation = EmailConfirmation.createInstance(userId, {
      hours: this.userConfirmationConfig.emailExpiresInHours,
      min: this.userConfirmationConfig.emailExpiresInMin,
    });

    await this.emailConfirmationRepository.save(emailConfirmation);

    this.eventBus.publish(
      new EmailConfirmRegistrationEvent(cmd.email, emailConfirmation.code),
    );
  }
}
