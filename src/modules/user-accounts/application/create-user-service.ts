import { CryptoService } from './crypto.service';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { CreateUsersInputDto } from '../api/input-dto/create-users.input-dto';
import { Injectable } from '@nestjs/common';
import { UserRepository } from '../infrastructure/user-repository';
import { User } from '../domin/user.entity';
import { EmailConfirmation } from '../domin/email-confirmation.entity';
import { UserConfirmationConfig } from '../config/user-confirmation.config';

@Injectable()
export class CreateUserService {
  constructor(
    protected userRepository: UserRepository,
    protected cryptoService: CryptoService,
    protected userConfirmationConfig: UserConfirmationConfig,
  ) {}

  private async validateUniqUser(login: string, email: string): Promise<void> {
    const userExists = await this.userRepository.findByEmailOrLogin(
      login,
      email,
    );
    if (userExists) {
      const extensionKey = login === userExists.login ? 'login' : 'email';
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          { field: extensionKey, message: 'login or email should be uniq' },
        ],
        message: 'Invalid login email',
      });
    }
  }

  /**
   *
   * Created User_root entity before all checked to uniq filed (login, email)
   * @param {CreateUsersInputDto}  userDto - payload
   * @param {boolean}  isConfirmedEmail - this flag for set confirmation email
   * @returns {string} - User_root id
   */
  async createUserEntity(
    userDto: CreateUsersInputDto,
    isConfirmedEmail: boolean,
  ): Promise<{ userId: string; confirmationCode: string }> {
    await this.validateUniqUser(userDto.login, userDto.email);

    const passwordHash = await this.cryptoService.createPasswordHash(
      userDto.password,
    );
    const user = User.createInstance({
      passwordHash: passwordHash,
      email: userDto.email,
      login: userDto.login,
    });

    const emailConfirmation = EmailConfirmation.createInstance(
      {
        hours: this.userConfirmationConfig.emailExpiresInHours,
        min: this.userConfirmationConfig.emailExpiresInMin,
      },
      isConfirmedEmail,
    );
    user.emailConfirmation = emailConfirmation;

    await this.userRepository.save(user);
    return { userId: user.id, confirmationCode: emailConfirmation.code };
  }

  // /** для админки (подтверждение почты автоматически)
  //  * @return {string} - идентификатор созданого пользователя
  //  * */
  // async addNewUserSa(userDto: CreateUsersInputDto): Promise<string> {
  //   const result = await this.createUserEntity(userDto, true);
  //
  //   return result.userId;
  // }
  //
  // /** для клиента (подтверждение почты обезательно)
  //  * @return {string} - идентификатор созданого пользователя
  //  * */
  // async registrationUserPublic(userDto: CreateUsersInputDto): Promise<string> {
  //   const result = await this.createUserEntity(userDto, false);
  //
  //   return result.userId;
  // }
}
