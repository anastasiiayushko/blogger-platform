import { CoreModule } from './core/core.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { TestingModule } from './modules/testing/testing.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { DomainExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { configModule } from './dynamic-config-module';
import { CoreConfig } from './core/core.config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DomainException } from './core/exceptions/domain-exception';
import { DomainExceptionCode } from './core/exceptions/domain-exception-codes';

@Module({
  imports: [
    CoreModule,
    configModule, //  инициализация конфигурации
    // Глобальная регистрация подключения к базе данных
    MongooseModule.forRootAsync({
      useFactory(coreConfig: CoreConfig) {
        const uri = coreConfig.mongoUrl;
        console.info(`MongoDB connect URI: ${uri}`);
        return { uri };
      },
      inject: [CoreConfig],
    }),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    ThrottlerModule.forRoot({
      throttlers: [{ limit: 5, ttl: 10000 }],
      errorMessage: () => {
        throw new DomainException({
          code: DomainExceptionCode.ManyRequests,
        });
      },
    }),
  ],
  controllers: [AppController],
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
