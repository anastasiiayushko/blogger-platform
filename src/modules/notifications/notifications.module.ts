import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { EmailPasswordRecoveryHandler } from './event-usecases/email-password-recovery.event-usecase';
import { EmailConfirmRegistrationHandler } from './event-usecases/email-confirm-registration.event-usecase';

//::TODO добавить конфиг
@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'smtp.gmail.com',
        port: 465,
        auth: {
          user: 'dinaswebstudio2020@gmail.com',
          pass: 'icjscncpvkvbixrr',
        },
      },
    }),
  ],
  providers: [EmailPasswordRecoveryHandler, EmailConfirmRegistrationHandler],
  exports: [EmailPasswordRecoveryHandler, EmailConfirmRegistrationHandler],
})
export class NotificationsModule {}
