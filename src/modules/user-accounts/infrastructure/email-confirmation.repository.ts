import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmailConfirmation } from '../domin/email-confirmation.entity';

@Injectable()
export class EmailConfirmationRepository {
  constructor(
    @InjectRepository(EmailConfirmation)
    protected emailRepository: Repository<EmailConfirmation>,
  ) {}

  async findByCode(code: string): Promise<EmailConfirmation | null> {
    const confirmation = await this.emailRepository.findOne({
      where: { code: code },
    });

    return confirmation;
  }

  async findByUserId(userId: string): Promise<EmailConfirmation | null> {
    const confirmaiton = await this.emailRepository.findOne({
      where: {
        userId: userId,
      },
    });
    return confirmaiton;
  }

  async save(emailConfirmation: EmailConfirmation): Promise<EmailConfirmation> {
    return await this.emailRepository.save(emailConfirmation);
  }
}
