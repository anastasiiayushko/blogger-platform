import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import cookieParser from 'cookie-parser';
import { CoreConfig } from './core/config/core.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'debug', 'error', 'warn'],
  });

  const port = app.get<CoreConfig>(CoreConfig)?.port;
  app.use(cookieParser());
  app.enableCors();
  appSetup(app);
  console.info(`App listening http://localhost:${port}/api`);
  await app.listen(port);
}

bootstrap();
