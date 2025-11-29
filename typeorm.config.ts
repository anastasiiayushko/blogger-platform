import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as process from 'node:process';
import { envFilePaths } from './src/dynamic-config-module';
import { snakeCase } from 'typeorm/util/StringUtils';
import { Table } from 'typeorm/schema-builder/table/Table';

config({ path: envFilePaths });

/**
 *  Расширяем стандартную snake-case стратегию, чтобы имена ограничений
 *  были детерминированными и совпадали с историческими `FK_<table>_<columns>`.
 *
 * */
class CustomSnakeNamingStrategy extends SnakeNamingStrategy {
  foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const table = typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const columns = columnNames.map((column) => snakeCase(column)).join('_');
    return `FK_${snakeCase(table)}_${columns}`;
  }

  // uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
  //   const sortedColumns = [...columnNames].sort();
  //   const baseName = `UQ_${this.formatTableName(tableOrName)}_${this.formatColumnSegment(sortedColumns)}`;
  //   return this.clampName(baseName);
  // }

}


// нужен как “едининый источник правды” для подключения к БД, который понимает и ваше приложение
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.PG_DATABASE_HOST,
  //@ts-expect-error
  port: process.env.PG_DATABASE_PORT,
  username: process.env.PG_DATABASE_USERNAME,
  password: process.env.PG_DATABASE_PASS,
  database: process.env.PG_DATABASE_NAME,
  // entities: [User],
  entities: ['src/**/*.entity.ts'],
  migrations: ['migrations/**/*.ts'],
  logging: ['query', 'error'],
  namingStrategy: new CustomSnakeNamingStrategy(),
  synchronize: false, // в проде всегда false
};

export default new DataSource(dataSourceOptions);
