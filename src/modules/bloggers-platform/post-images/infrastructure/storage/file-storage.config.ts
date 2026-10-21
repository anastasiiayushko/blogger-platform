import { Trim } from '../../../../../core/decorators/transform/trim';
import { registerAs } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { configValidationUtility } from '../../../../../setup/config-validation.utility';
import { IsString, IsUrl, Matches } from 'class-validator';

class FileStorageConfig {
  @Trim()
  @IsString()
  @IsUrl({ protocols: ['https'] }) // Базовая проверка, что это URL
  @Matches(
    // Проверяет 32 символа хэша, опциональную юрисдикцию и домен r2.cloudflarestorage.com
    /^https:\/\/[a-f0-9]{32}\.(?:[a-z]{2}\.)?r2\.cloudflarestorage\.com(?:\/[a-zA-Z0-9-_\.]+)?$/,
    {
      message:
        'Неверный формат эндпоинта Cloudflare R2. Пример: https://your-account-id.r2.cloudflarestorage.com',
    },
  )
  declare readonly endpoint: string;

  @Trim()
  @IsString()
  declare readonly accessKeyId: string;

  @Trim()
  @IsString()
  declare readonly secretAccessKey: string;
}

export const fileStorageConfig = registerAs('fileStorageConfig', () => {
  const config = plainToInstance(FileStorageConfig, {
    endpoint: process.env.S3_ENDPOINT,
    //Идентификатор ключа доступа
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    //Секретный ключ доступа
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  });
  //::TODO проверить почему вызвов валидации вызывает ошибку
  configValidationUtility.validateConfig(config);
  return config;
});
