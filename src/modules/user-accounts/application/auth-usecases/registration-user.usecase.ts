import { CreateUsersInputDto } from '../../api/input-dto/create-users.input-dto';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CreateUserService } from '../create-user-service';
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
    protected eventBus: EventBus,
  ) {}

  async execute(cmd: RegistrationUserCommand): Promise<void> {
    const result = await this.createUserService.createUserEntity(cmd, false);
    // const emailConfirmation = EmailConfirmation.createInstance(userId, {
    //   hours: this.userConfirmationConfig.emailExpiresInHours,
    //   min: this.userConfirmationConfig.emailExpiresInMin,
    // });
    //
    // await this.emailConfirmationRepository.save(emailConfirmation);

    this.eventBus.publish(
      new EmailConfirmRegistrationEvent(cmd.email, result.confirmationCode),
    );
  }
}
