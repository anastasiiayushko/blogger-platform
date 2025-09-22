import { CryptoService } from './crypto.service';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { CreateUsersInputDto } from '../api/input-dto/create-users.input-dto';
import { UsersSqlRepository } from '../infrastructure/sql/users.sql-repository';
import { User } from '../domin/sql-entity/user.sql-entity';
import { Injectable } from '@nestjs/common';

@Injectable()
export class CreateUserService {
  constructor(
    protected userRepository: UsersSqlRepository,
    protected cryptoService: CryptoService,
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
   * Created User entity before all checked to uniq filed (login, email)
   * @param {CreateUsersInputDto}  userDto - payload
   * @returns {string} - User id
   */
  async createUserEntity(userDto: CreateUsersInputDto): Promise<string> {
    await this.validateUniqUser(userDto.login, userDto.email);

    const passwordHash = await this.cryptoService.createPasswordHash(
      userDto.password,
    );

    const userId = await this.userRepository.create(
      User.createInstance({
        passwordHash: passwordHash,
        email: userDto.email,
        login: userDto.login,
      }),
    );

    return userId;
  }

  //::TODO унести создание в usecase
  /** для админки (подтверждение почты автоматически)
   * @return {string} - идентификатор созданого пользователя
   * */
  async addNewUserSa(userDto: CreateUsersInputDto): Promise<string> {
    const userId = await this.createUserEntity(userDto);

    return userId;
  }
}
