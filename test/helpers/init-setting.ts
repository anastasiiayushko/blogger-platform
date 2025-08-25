import { AppModule } from '../../src/app.module';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';
import { deleteAllData } from './delete-all-data';
import { UsersApiManagerHelper } from './api-manager/users-api-manager-helper';
import cookieParser from 'cookie-parser';
import {
  EmailConfirmRegistrationEvent,
  EmailConfirmRegistrationHandler,
} from '../../src/modules/notifications/event-usecases/email-confirm-registration.event-usecase';
import {
  EmailPasswordRecoveryEvent,
  EmailPasswordRecoveryHandler,
} from '../../src/modules/notifications/event-usecases/email-password-recovery.event-usecase';

type ReturnInitSetting = {
  app: INestApplication;
  databaseConnection: Connection;
  userTestManger: UsersApiManagerHelper;
  // httpServer: any
};

export const initSettings = async (
  //передаем callback, который получает ModuleBuilder, если хотим изменить настройку тестового модуля
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
): Promise<ReturnInitSetting> => {
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  })

    .overrideProvider(EmailConfirmRegistrationHandler)
    .useValue({
      handle: jest
        .fn()
        .mockImplementation((event: EmailConfirmRegistrationEvent) => {
          console.log(
            '✅ MOCKED email confirm registration handler triggered with event:',
            event,
          );
        }),
    })
    .overrideProvider(EmailPasswordRecoveryHandler)
    .useValue({
      handle: jest
        .fn()
        .mockImplementation((event: EmailPasswordRecoveryEvent) => {
          console.log(
            '✅ MOCKED email password recovery handler triggered with event:',
            event,
          );
        }),
    });

  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  const testingAppModule = await testingModuleBuilder.compile();

  const app = testingAppModule.createNestApplication();

  app.use(cookieParser());
  appSetup(app);

  await app.init();

  const databaseConnection = app.get<Connection>(getConnectionToken());
  const httpServer = app.getHttpServer();
  const userTestManger = new UsersApiManagerHelper(app);

  await deleteAllData(app);

  return {
    app,
    databaseConnection,
    userTestManger,
  };
};
