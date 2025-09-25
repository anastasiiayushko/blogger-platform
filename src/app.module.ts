import { CoreModule } from './core/core.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { TestingModule } from './modules/testing/testing.module';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { AllExceptionsFilter } from './core/exceptions/filters/all-exceptions.filter';
import { DomainExceptionsFilter } from './core/exceptions/filters/domain-exceptions.filter';
import { configModule } from './dynamic-config-module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DomainException } from './core/exceptions/domain-exception';
import { DomainExceptionCode } from './core/exceptions/domain-exception-codes';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerConfig } from './core/config/throttler.config';

@Module({
  imports: [
    CoreModule,
    configModule, //  инициализация конфигурации
    // Глобальная регистрация подключения к базе данных
    // MongooseModule.forRootAsync({
    //   useFactory(coreConfig: CoreConfig) {
    //     const uri = coreConfig.mongoUrl;
    //     console.info(`MongoDB connect URI: ${uri}`);
    //     return { uri };
    //   },
    //   inject: [CoreConfig],
    // }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'sa',
      database: 'BloggerPlatformDev',
      synchronize: false, // Указывает, следует ли автоматически создавать схему базы данных при каждом запуске приложения
    }),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
    ThrottlerModule.forRootAsync({
      inject: [ThrottlerConfig],
      useFactory: (config: ThrottlerConfig) => {
        const enabled = config.enabled;
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
