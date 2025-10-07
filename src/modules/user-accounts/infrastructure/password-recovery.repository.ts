import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PasswordRecovery } from '../domin/password-recovery.entity';

@Injectable()
export class PasswordRecoveryRepository {
  constructor(
    @InjectRepository(PasswordRecovery)
    protected passRecoveryRepository: Repository<PasswordRecovery>,
  ) {}

  async findByCode(code: string): Promise<PasswordRecovery | null> {
    return this.passRecoveryRepository.findOne({
      select: {
        user:{id: true},
        id: true,
        code:true,
        expirationAt: true,
        isConfirmed: true,
      },
      relations: {
        user:true,
      },
      where: { code },
    });
  }

  async findByUserId(userId: string): Promise<PasswordRecovery | null> {
    return this.passRecoveryRepository.findOneBy({ user: { id: userId } });
  }

  async save(recovery: PasswordRecovery): Promise<PasswordRecovery> {
    return this.passRecoveryRepository.save(recovery);
  }

  async deleteByUserId(userId: string): Promise<boolean> {
    throw new Error('Method not implemented.');
    return false;
  }
}
