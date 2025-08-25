import { Injectable } from '@nestjs/common';
import { CryptoService } from './crypto.service';
import { UsersSqlRepository } from '../infrastructure/sql/users.sql-repository';

@Injectable()
//::TODO рефакторинг
export class AuthService {
  constructor(
    protected userRepository: UsersSqlRepository,
    protected cryptoService: CryptoService,
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
}
