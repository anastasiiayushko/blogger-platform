import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

/** old version  */
@Injectable()
export class EmailNotificationService {
  constructor(private mailerService: MailerService) {}

  confirmRegistration(emailTo: string, confirmedCode: string) {
    this.mailerService
      .sendMail({
        from: '"Blogger Platform 👻" <dinaswebstudio2020@gmail.com>', // sender address
        to: emailTo, // list of receivers
        subject: 'Blogger platform ✔', // Subject line
        html: `
               <p>To finish registration please follow the link below:
                     <a href='https://somesite.com/confirm-email?code=${confirmedCode}'>complete registration</a>
                </p>`,
      })
      .catch((e) => {
        console.error(`Failed to send email ${e}`);
      });
  }

  recoveryPassword(emailTo: string, recoveryCode: string) {
    this.mailerService
      .sendMail({
        from: '"Blogger Platform 👻" <dinaswebstudio2020@gmail.com>', // sender address
        to: emailTo, // list of receivers
        subject: 'Password recovery to Blogger platform ✔', // Subject line
        html: `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${recoveryCode}'>recovery password</a>
      </p>`,
      })
      .catch((e) => {
        console.error('recoveryPassword', e.message);
      });
  }
}
