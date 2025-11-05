import { ConfigModule } from '@nestjs/config';
// you must import this const in the head of your app.module.ts
//Централизованное управление переменными
export const envFilePaths = [
  process.env.ENV_FILE_PATH?.trim() || '',
  // join(__dirname, 'env', `.env.${process.env.NODE_ENV}.local`),
  // join(__dirname, 'env', `.env.${process.env.NODE_ENV}`),
  // join(__dirname, 'env', '.env.production'),
  `.env.${process.env.NODE_ENV}.local`,
  `.env.${process.env.NODE_ENV}`,
  '.env.development',
];
export const configModule = ConfigModule.forRoot({
  envFilePath: envFilePaths,
  isGlobal: true, // делает доступным во всех модулях без повторного импорта
});
