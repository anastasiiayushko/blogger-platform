import { Global, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { CoreConfig } from './core.config';
import { ThrottlerConfig } from './config/throttler.config';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  imports: [CqrsModule],
  providers: [CoreConfig, ThrottlerConfig],
  exports: [CoreConfig, CqrsModule, ThrottlerConfig],
})
export class CoreModule {}
