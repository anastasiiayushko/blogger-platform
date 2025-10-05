import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CreateUsersInputDto } from '../../api/input-dto/create-users.input-dto';
import { CreateUserService } from '../create-user-service';
import { UserConfirmationConfig } from '../../config/user-confirmation.config';

export class SaCreateUserCommand {
  login: string;
  email: string;
  password: string;

  constructor(dto: CreateUsersInputDto) {
    this.login = dto.login;
    this.email = dto.email;
    this.password = dto.password;
  }
}

@CommandHandler(SaCreateUserCommand)
export class SaCreateUserHandler
  implements ICommandHandler<SaCreateUserCommand, string>
{
  constructor(
    protected createUserService: CreateUserService,
    protected userConfirmationConfig: UserConfirmationConfig,
    // protected emailConfirmationRepository: EmailConfirmationSqlRepository,
  ) {}

  async execute(cmd: SaCreateUserCommand): Promise<string> {
    const result = await this.createUserService.createUserEntity(cmd, true);
    // const emailConfirmation = EmailConfirmation.createInstance(userId, {
    //   hours: this.userConfirmationConfig.emailExpiresInHours,
    //   min: this.userConfirmationConfig.emailExpiresInMin,
    // });
    // emailConfirmation.confirm();
    // await this.emailConfirmationRepository.save(emailConfirmation);
    return result.userId;
  }
}
