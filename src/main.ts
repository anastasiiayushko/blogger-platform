import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';
import cookieParser from 'cookie-parser';
import { CoreConfig } from './core/core.config';
import * as process from 'node:process';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'debug', 'error', 'warn'],
  });
  console.log('BOOSTRAPING ');
  // const port = process.env.PORT ?? 8080;
  const port = app.get<CoreConfig>(CoreConfig)?.port;
  app.use(cookieParser());
  app.enableCors();
  appSetup(app);
  console.log('App listening on port', port);
  await app.listen(port);
}

bootstrap();
