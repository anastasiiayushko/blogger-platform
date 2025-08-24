import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MailerService } from '@nestjs-modules/mailer';

export class EmailPasswordRecoveryEvent {
  constructor(
    public readonly email: string,
    public readonly code: string,
  ) {}
}

@EventsHandler(EmailPasswordRecoveryEvent)
export class EmailPasswordRecoveryHandler
  implements IEventHandler<EmailPasswordRecoveryEvent>
{
  constructor(private mailerService: MailerService) {}

  handle(event: EmailPasswordRecoveryEvent) {
    this.mailerService
      .sendMail({
        from: '"Blogger Platform 👻" <dinaswebstudio2020@gmail.com>', // sender address
        to: event.email, // list of receivers
        subject: 'Password recovery to Blogger platform ✔', // Subject line
        html: `<h1>Password recovery</h1>
       <p>To finish password recovery please follow the link below:
          <a href='https://somesite.com/password-recovery?recoveryCode=${event.code}'>recovery password</a>
      </p>`,
      })
      .catch((e) => {
        console.error('recoveryPassword', e.message);
      });
  }
}
