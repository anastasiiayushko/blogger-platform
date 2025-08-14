import { AppModule } from '../../src/app.module';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';
import { deleteAllData } from './delete-all-data';
import { EmailNotificationService } from '../../src/modules/notifications/emal.service';
import { EmailServiceMock } from '../mock/EmailServiceMock';
import { UsersApiManagerHelper } from './api-manager/users-api-manager-helper';
import cookieParser from 'cookie-parser';

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
    .overrideProvider(EmailNotificationService)
    .useClass(EmailServiceMock);

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
