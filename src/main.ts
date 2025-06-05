import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { appSetup } from './setup/app.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'debug', 'error', 'warn'],
  });
  app.enableCors();
  appSetup(app);
  console.log('App listening on port', process.env.PORT);
  await app.listen(process.env.PORT ?? 8080);
}

bootstrap();
