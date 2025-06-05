import { AppModule } from '../../src/app.module';
import { Test, TestingModuleBuilder } from '@nestjs/testing';
import { appSetup } from '../../src/setup/app.setup';
import { Connection } from 'mongoose';
import { getConnectionToken } from '@nestjs/mongoose';
import { INestApplication } from '@nestjs/common';
import { deleteAllData } from './delete-all-data';
import { UsersTestManagerHelper } from './users-test-manager-helper';

type ReturnInitSetting = {
  app: INestApplication;
  databaseConnection: Connection;
  userTestManger: UsersTestManagerHelper;
  // httpServer: any
};

export const initSettings = async (
  //передаем callback, который получает ModuleBuilder, если хотим изменить настройку тестового модуля
  addSettingsToModuleBuilder?: (moduleBuilder: TestingModuleBuilder) => void,
): Promise<ReturnInitSetting> => {
  const testingModuleBuilder: TestingModuleBuilder = Test.createTestingModule({
    imports: [AppModule],
  });
  // .overrideProvider(EmailService)
  // .useClass(EmailServiceMock);
  if (addSettingsToModuleBuilder) {
    addSettingsToModuleBuilder(testingModuleBuilder);
  }

  const testingAppModule = await testingModuleBuilder.compile();

  const app = testingAppModule.createNestApplication();

  appSetup(app);

  await app.init();

  const databaseConnection = app.get<Connection>(getConnectionToken());
  const httpServer = app.getHttpServer();
  const userTestManger = new UsersTestManagerHelper(app);

  await deleteAllData(app);

  return {
    app,
    databaseConnection,
    // httpServer,
    userTestManger,
  };
};
