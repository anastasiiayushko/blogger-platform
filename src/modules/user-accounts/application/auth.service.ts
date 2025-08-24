import { Injectable } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { EmailNotificationService } from '../../notifications/emal.service';
import { CreateUserService } from './create-user-service';
import { ValidateDomainDto } from '../../../core/decorators/validate-domain-dto/ValidateDomainDto';
import { CreateUsersInputDto } from '../api/input-dto/create-users.input-dto';
import { UsersSqlRepository } from '../infrastructure/sql/users.sql-repository';

@Injectable()
export class AuthService {
  constructor(
    private createUserService: CreateUserService,
    protected userRepository: UsersSqlRepository,
    protected cryptoService: CryptoService,
    protected emailNotificationService: EmailNotificationService,
  ) {}

  async validateUser(loginOrEmail: string, password: string) {
    const user = await this.userRepository.findByEmailOrLogin(loginOrEmail);
    if (!user) {
      return null;
    }
    const isValidPassword = await this.cryptoService.comparePassword(
      password,
      user.password,
    );
    if (!isValidPassword) {
      return null;
    }
    return user;
  }

  @ValidateDomainDto(CreateUsersInputDto)
  async registration(userDto: CreateUsersInputDto) {
    const user = await this.createUserService.registerUser(userDto);

    this.emailNotificationService.confirmRegistration(
      user.email,
      user.emailConfirmationCode,
    );
  }

  // async confirmEmailByCode(code: string) {
  //   // const user = await this.userRepository.findByEmailConfirmationCode(code);
  //   // if (!user) {
  //   //   throw new DomainException({
  //   //     code: DomainExceptionCode.BadRequest,
  //   //     extensions: [
  //   //       { field: 'code', message: 'Confirmation Code is invalid' },
  //   //     ],
  //   //   });
  //   // }
  //   //
  //   // if (
  //   //   DateUtil.hasExpired(new Date(), user.emailConfirmation.expirationDate) ||
  //   //   user.emailConfirmation.isConfirmed
  //   // ) {
  //   //   throw new DomainException({
  //   //     code: DomainExceptionCode.BadRequest,
  //   //     extensions: [
  //   //       { field: 'code', message: 'Confirmation Code is invalid' },
  //   //     ],
  //   //   });
  //   // }
  //   // user.confirmEmail();
  //   // await this.userRepository.save(user);
  // }

  async recoverEmailConfirm(email: string) {
    // const user = await this.userRepository.findByEmailOrLogin(email);
    // if (!user || user.emailConfirmation.isConfirmed) {
    //   throw new DomainException({
    //     code: DomainExceptionCode.BadRequest,
    //     extensions: [
    //       {
    //         field: 'email',
    //         message:
    //           'If your email exists and is not confirmed, a confirmation message will be sent',
    //       },
    //     ],
    //   });
    // }
    // user.generateNewCodeOfConfirmEmail({
    //   hours: this.userConfirmationConfig.emailExpiresInHours,
    //   min: this.userConfirmationConfig.emailExpiresInMin,
    // });
    // await this.userRepository.save(user);
    // this.emailNotificationService.confirmRegistration(
    //   user.email,
    //   user.emailConfirmation.confirmationCode,
    // );
  }
}
