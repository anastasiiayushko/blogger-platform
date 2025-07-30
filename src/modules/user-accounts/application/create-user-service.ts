import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument, UserModelType } from '../domin/user.entity';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from './crypto.service';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { CreateUsersInputDto } from '../api/input-dto/create-users.input-dto';
import { ConfigService } from '@nestjs/config';

export class CreateUserService {
  constructor(
    private userRepository: UsersRepository,
    private cryptoService: CryptoService,
    private configService: ConfigService,
    @InjectModel(User.name) private userModel: UserModelType,
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

  private async createUserEntity(
    userDto: CreateUsersInputDto,
  ): Promise<UserDocument> {
    await this.validateUniqUser(userDto.login, userDto.email);

    const passwordHash = await this.cryptoService.createPasswordHash(
      userDto.password,
    );

    const user = this.userModel.createInstance(
      {
        passwordHash: passwordHash,
        email: userDto.email,
        login: userDto.login,
      },
      {
        hours: this.configService.get<number>('EXPIRATION_DATE_HOURS') || 0,
        min: this.configService.get<number>('EXPIRATION_DATE_MIN') || 0,
      },
    );
    await this.userRepository.save(user);

    return user;
  }

  /** для админки (подтверждение почты автоматически)
   * @return {string} - идентификатор созданого пользователя
   * */
  async addNewUser(userDto: CreateUsersInputDto): Promise<string> {
    const user = await this.createUserEntity(userDto);
    user.confirmEmail();
    await this.userRepository.save(user);
    return user._id.toString();
  }

  /** для клиента (регистрация без автоматического подтверждения)
   * @return {
   *   id - user._id
   *   emailConfirmationCode: code for verification email
   *   email: user email
   * } - идентификатор созданого пользователя
   * */
  async registerUser(userDto: CreateUsersInputDto): Promise<{
    id: string;
    emailConfirmationCode: string;
    email: string;
  }> {
    const user = await this.createUserEntity(userDto);
    return {
      id: user._id.toString(),
      emailConfirmationCode: user.emailConfirmation.confirmationCode,
      email: user.email,
    };
  }
}
