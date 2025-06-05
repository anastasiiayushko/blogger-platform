import { Module } from '@nestjs/common';
import { MailerModule, MailerService } from '@nestjs-modules/mailer';
import { EmailNotificationService } from './emal.service';

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
  providers: [EmailNotificationService],
  exports: [EmailNotificationService],
})
export class NotificationsModule {}
