import { Injectable } from '@nestjs/common';
import { EmailNotificationService } from '../../src/modules/notifications/emal.service';

@Injectable()
export class EmailServiceMock extends EmailNotificationService {
  recoveryPassword(emailTo: string, recoveryCode: string) {
    console.info('EmailServiceMock.recoveryPassword', emailTo, recoveryCode);
  }

  confirmRegistration(emailTo: string, confirmedCode: string) {
    console.info(
      'EmailServiceMock.confirmRegistration',
      emailTo,
      confirmedCode,
    );
  }
}
