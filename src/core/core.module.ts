import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { ThrottlerConfig } from './config/throttler.config';
import { CoreConfig } from './config/core.config';
import { DatabaseConfig } from './config/database-config';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  imports: [CqrsModule],
  providers: [CoreConfig, ThrottlerConfig, DatabaseConfig],
  exports: [CoreConfig, CqrsModule, ThrottlerConfig, DatabaseConfig],
})
export class CoreModule {}
