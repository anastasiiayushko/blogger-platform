import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerConfig } from './config/throttler.config';
import { CoreConfig } from './config/core.config';
import { AppLoggerService } from './logger/app-logger.service';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  imports: [CqrsModule],
  providers: [CoreConfig, ThrottlerConfig, AppLoggerService],
  exports: [CoreConfig, CqrsModule, ThrottlerConfig, AppLoggerService],
})
export class CoreModule {}
