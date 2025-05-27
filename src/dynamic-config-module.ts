import { ConfigModule } from '@nestjs/config';

// you must import this const in the head of your app.module.ts
//Централизованное управление переменными
export const configModule = ConfigModule.forRoot({
  envFilePath: [
    // process.env.ENV_FILE_PATH?.trim() || '',
    `.env.${process.env.NODE_ENV}`,
    `.env.${process.env.NODE_ENV}`,
    '.env.production',
  ],
  isGlobal: true, // делает доступным во всех модулях без повторного импорта
});
