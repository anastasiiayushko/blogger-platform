import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CryptoService {
  constructor() {}

  async createPasswordHash(password: string): Promise<string> {
    const saltRound = 5;
    const salt = await bcrypt.genSalt(saltRound);

    return await bcrypt.hash(password, salt);
  }

  async comparePassword(
    password: string,
    passwordHash: string,
  ): Promise<boolean> {
    return await bcrypt.compare(password, passwordHash);
  }
}
