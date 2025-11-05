import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import * as process from 'node:process';
import { envFilePaths } from './src/dynamic-config-module';

console.log(envFilePaths, 'envFilePaths');
config({ path: envFilePaths });

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
  namingStrategy: new SnakeNamingStrategy(),
  synchronize: false, // в проде всегда false
};
console.log(dataSourceOptions);
export default new DataSource(dataSourceOptions);
