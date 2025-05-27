import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class NotificationService {
  constructor(private mailerService: MailerService) {}

  sendConfirmReqistration(emailTo: string, confirmedCode: string) {
    this.mailerService
      .sendMail({
        from: '"Blogger Platform 👻" <dinaswebstudio2020@gmail.com>', // sender address
        to: emailTo, // list of receivers
        subject: 'Confirmed registration to Blogger platform ✔', // Subject line
        html: `<h1>Thank for your registration</h1>
                <p>To finish registration please follow the link below:
                     <a href='https://somesite.com/confirm-email?code=${confirmedCode}'>complete registration</a>
                </p>`,
      })
      .catch((e) => {
        console.error(`Failed to send email ${e}`);
      });
  }
}
