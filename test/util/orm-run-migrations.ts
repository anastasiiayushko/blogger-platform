import { DataSource } from 'typeorm';
import * as process from 'node:process';

export async function ormRunMigrations(dataSource: DataSource) {
  try {
    process.env.NODE_ENV = 'testing';
    await dataSource.initialize();
    await dataSource.runMigrations(); // применит все непроведенные миграции
    await dataSource.destroy();
  } catch (error) {
    console.trace(error);
    process.exit(1);
  }
}
