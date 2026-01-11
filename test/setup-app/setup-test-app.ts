import { INestApplication } from '@nestjs/common';
import { Test, TestingModule, TestingModuleBuilder } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { AppModule } from '../../src/app.module';

export interface SetupTestAppOptions {
  imports: any[]; // твои модули
  providers?: any[];
  override?: (moduleBuilder: TestingModuleBuilder) => void | Promise<void>;
  initHttp?: boolean; // нужно ли HTTP (для e2e)
}

export interface TestApp {
  appNest: INestApplication;
  module: TestingModule;
  dataSource: DataSource;
  close: () => Promise<void>;
}

export async function setupTestApp(
  options: SetupTestAppOptions,
): Promise<TestApp> {
  const { imports, override, initHttp = true, providers = [] } = options;
  if (!Array.isArray(imports) || !imports.length) {
    // throw new Error('Import must be an array and not empty');
  }

  const moduleMetaData = {
    imports: !Array.isArray(imports) || !imports.length ? [AppModule] : imports,
  };
  if (providers.length) {
    moduleMetaData['providers'] = providers;
  }
  let moduleBuilder = Test.createTestingModule(moduleMetaData);

  if (override) {
    await override(moduleBuilder);
  }

  const moduleRef = await moduleBuilder.compile();
  const app = moduleRef.createNestApplication();
  if (initHttp) {
    await app.init(); // поднимает HTTP слой: контроллеры, middleware и т.п.
  }

  const dataSource = app.get(DataSource);

  return {
    appNest: app,
    module: moduleRef,
    dataSource,
    close: () => app.close(),
  };
}
