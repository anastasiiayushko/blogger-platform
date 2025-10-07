import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { CryptoService } from '../crypto.service';
import { PasswordRecoveryRepository } from '../../infrastructure/password-recovery.repository';
import { UserRepository } from '../../infrastructure/user-repository';

export class UpdatePasswordCommand {
  constructor(
    public recoveryCode: string,
    public newPassword: string,
  ) {}
}

@CommandHandler(UpdatePasswordCommand)
export class UpdatePasswordCommandHandler
  implements ICommandHandler<UpdatePasswordCommand, void>
{
  constructor(
    protected recoveryPasswordRepository: PasswordRecoveryRepository,
    protected usersRepository: UserRepository,
    protected cryptoService: CryptoService,
    protected eventBus: EventBus,
  ) {}

  async execute(cmd: UpdatePasswordCommand): Promise<void> {
    const passwordRecovery = await this.recoveryPasswordRepository.findByCode(
      cmd.recoveryCode,
    );

    const user = passwordRecovery
      ? await this.usersRepository.findById(passwordRecovery.user.id)
      : null;

    if (
      !user ||
      !passwordRecovery ||
      passwordRecovery.isConfirmed ||
      passwordRecovery.isExpired()
    ) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [{ field: 'code', message: 'incorrect value' }],
      });
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      cmd.newPassword,
    );
    user.updatePassword(passwordHash);
    passwordRecovery.confirm();

    await this.recoveryPasswordRepository.save(passwordRecovery);
    await this.usersRepository.save(user);
    return;
  }
}
