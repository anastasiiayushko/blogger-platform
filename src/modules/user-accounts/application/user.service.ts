import { Injectable } from '@nestjs/common';
import { UserInputDTO } from '../api/input-dto/users.input-dto';
import { UsersRepository } from '../infrastructure/users.repository';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { ValidateDomainDto } from '../../../core/decorators/validate-domain-dto/ValidateDomainDto';
import { CryptoService } from './crypto.service';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../domin/user.entity';

@Injectable()
export class UserService {
  constructor(
    private userRepository: UsersRepository,
    private cryptoService: CryptoService,
    @InjectModel(User.name) private userModel: UserModelType,
  ) {}

  @ValidateDomainDto(UserInputDTO)
  async createUser(
    userDto: UserInputDTO,
    isConfirmed: boolean,
  ): Promise<string> {
    const userExists = await this.userRepository.findByEmailOrLogin(
      userDto.login,
      userDto.email,
    );
    if (userExists) {
      const extensionKey =
        userDto.login === userExists.login ? 'login' : 'email';
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          { field: extensionKey, message: 'login or email should be uniq' },
        ],
        message: 'Invalid login email',
      });
    }
    const passwordHash = await this.cryptoService.createPasswordHash(
      userDto.password,
    );

    const user = this.userModel.createInstance(
      {
        passwordHash: passwordHash,
        email: userDto.email,
        login: userDto.login,
      },
      isConfirmed,
    );
    await this.userRepository.save(user);
    return user._id.toString();
  }

  async deleteUser(userId: string) {
    await this.userRepository.findOrNotFoundFail(userId);
    return await this.userRepository.delete(userId);
  }
}
