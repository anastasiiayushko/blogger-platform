import { CoreModule } from './core/core.module';
import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { TestingModule } from './modules/testing/testing.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { DomainExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { configModule } from './dynamic-config-module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DomainException } from './core/exceptions/domain-exception';
import { DomainExceptionCode } from './core/exceptions/domain-exception-codes';
import { ThrottlerConfig } from './core/config/throttler.config';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { QuizGameModule } from './modules/quiz/quiz-game.module';
import { DatabaseModule } from './core/database/database.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    CoreModule,
    configModule, //  инициализация конфигурации
    DatabaseModule,
    ScheduleModule.forRoot(),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    QuizGameModule,
    ThrottlerModule.forRootAsync({
      inject: [ThrottlerConfig],
      useFactory: (config: ThrottlerConfig) => {
        const enabled = config.enabled;
        console.log('Throttler on', enabled);
        return {
          throttlers: enabled ? [{ limit: config.limit, ttl: config.ttl }] : [],
          errorMessage: () => {
            throw new DomainException({
              code: DomainExceptionCode.ManyRequests,
            });
          },
        };
      },
    }),
  ],
  controllers: [],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionsFilter,
    },
  ],
})
export class AppModule {}
