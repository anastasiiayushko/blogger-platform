import { Injectable } from '@nestjs/common';
import { UsersRepository } from '../infrastructure/users.repository';
import { CryptoService } from './crypto.service';
import { JwtService } from '@nestjs/jwt';
import { DomainException } from '../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../core/exceptions/domain-exception-codes';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AuthService {
  constructor(
    protected userRepository: UsersRepository,
    protected cryptoService: CryptoService,
    protected jwtService: JwtService,
    protected configService: ConfigService,
  ) {}

  async validateUser(loginOrEmail: string, password: string) {
    console.log('service validUser', loginOrEmail, password);
    if (!loginOrEmail || !password) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        extensions: [
          { field: 'loginOrEmail', message: 'Invalid login or password' },
        ],
      });
    }
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

  signIn(userId: string) {
    const secret = this.configService.get<string>('JWT_AT_SECRET');
    const expiresIn = this.configService.get<string>('JWT_AT_EXPIRES');
    if (!secret || !expiresIn) {
      throw new Error(`For create token, should be setting param not empty`);
    }
    const accessToken = this.jwtService.sign(
      { userId: userId },
      { secret: secret, expiresIn: expiresIn },
    );

    return { accessToken: accessToken };
  }
}
