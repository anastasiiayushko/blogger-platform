import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserAccountsModule } from './modules/user-accounts/user-accounts.module';
import { MongooseModule } from '@nestjs/mongoose';
import { BloggersPlatformModule } from './modules/bloggers-platform/bloggers-platform.module';
import { TestingModule } from './modules/testing/testing.module';
import { configModule } from './dynamic-config-module';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    configModule, //  инициализация конфигурации
    // Глобальная регистрация подключения к базе данных
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory(configService: ConfigService) {
        const uri = configService.get<string>('MONGODB_URI');
        console.info(`MongoDB connect URI: ${uri}`);
        return { uri };
      },
    }),

    UserAccountsModule,
    BloggersPlatformModule,
    TestingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
