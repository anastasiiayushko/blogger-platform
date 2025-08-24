import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { MailerService } from '@nestjs-modules/mailer';

export class EmailConfirmRegistrationEvent {
  constructor(
    public readonly email: string,
    public readonly code: string,
  ) {}
}

@EventsHandler(EmailConfirmRegistrationEvent)
export class EmailConfirmRegistrationHandler
  implements IEventHandler<EmailConfirmRegistrationEvent>
{
  constructor(private mailerService: MailerService) {}

  handle(event: EmailConfirmRegistrationEvent) {
    this.mailerService
      .sendMail({
        from: '"Blogger Platform 👻" <dinaswebstudio2020@gmail.com>', // sender address
        to: event.email, // list of receivers
        subject: 'Blogger platform ✔', // Subject line
        html: `
               <p>To finish registration please follow the link below:
                     <a href='https://somesite.com/confirm-email?code=${event.code}'>complete registration</a>
                     <a href='https://somesite.com/confirm-email?code=${event.code}'>complete registration</a>
                </p>`,
      })
      .catch((e) => {
        console.error(`Failed to send email ${e}`);
      });
  }
}
