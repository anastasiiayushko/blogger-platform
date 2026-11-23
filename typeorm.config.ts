import { DataSource, DataSourceOptions, Table } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as process from 'node:process';
import { envFilePaths } from './src/env-file-paths';
import { SeederOptions } from 'typeorm-extension';

config({ path: envFilePaths });

/**
 *  Расширяем стандартную snake-case стратегию, чтобы имена ограничений
 *  были детерминированными и совпадали с историческими `FK_<table>_<columns>`.
 *
 * */
class CustomSnakeNamingStrategy extends SnakeNamingStrategy {
  foreignKeyName(tableOrName: Table | string, columnNames: string[]): string {
    const table =
      typeof tableOrName === 'string' ? tableOrName : tableOrName.name;
    const columns = columnNames
      .map((column) => this.relationName(column))
      .join('_');
    return `FK_${this.relationName(table)}_${columns}`;
  }
  // uniqueConstraintName(
  //   tableOrName: Table | string,
  //   columnNames: string[],
  // ): string {
  //   return super.uniqueConstraintName(tableOrName, columnNames);
  // }

  // uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
  //   const sortedColumns = [...columnNames].sort();
  //   const baseName = `UQ_${this.formatTableName(tableOrName)}_${this.formatColumnSegment(sortedColumns)}`;
  //   return this.clampName(baseName);
  // }
}

// нужен как “едининый источник правды” для подключения к БД, который понимает и ваше приложение
export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  url: process.env.DATABASE_URL,
  // entities: [User],
  entities: ['src/**/*.entity.ts'],
  migrations: ['migrations/**/*.ts'],
  seeds: ['seeds/**/*.seeder.ts'],
  logging: ['query', 'error'],
  namingStrategy: new CustomSnakeNamingStrategy(),
  synchronize: false, // в проде всегда false
};

export default new DataSource(dataSourceOptions);
