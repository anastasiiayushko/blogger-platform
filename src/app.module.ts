import { CoreModule } from './core/core.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
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
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerConfig } from './core/config/throttler.config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DatabaseConfig } from './core/config/database-config';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';

@Module({
  imports: [
    CoreModule,
    configModule, //  инициализация конфигурации
    TypeOrmModule.forRootAsync({
      // явно подтягиваем модуль, который экспортирует DatabaseConfig
      imports: [CoreModule],
      inject: [DatabaseConfig],
      useFactory(databaseConfig: DatabaseConfig) {
        return {
          type: 'postgres',
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.database,
          synchronize: databaseConfig.synchronize, // Указывает, следует ли автоматически создавать схему базы данных при каждом запуске приложения. Рекомендуется отключить в продакшене
          autoLoadEntities: databaseConfig.autoLoadEntities, // for dev
          logging: databaseConfig.logging, //Включает или выключает логирование запросов к базе данных
          namingStrategy: new SnakeNamingStrategy(),
        };
      },
    }),
    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
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
