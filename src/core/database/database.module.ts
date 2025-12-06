// src/core/database/database.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { DatabaseConfig } from './database-config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      extraProviders: [DatabaseConfig],
      inject: [DatabaseConfig],
      useFactory: (databaseConfig: DatabaseConfig) => {
        // console.log('database config', databaseConfig);
        return {
          type: 'postgres',
          host: databaseConfig.host,
          port: databaseConfig.port,
          username: databaseConfig.username,
          password: databaseConfig.password,
          database: databaseConfig.database,
          synchronize: false,
          autoLoadEntities: databaseConfig.autoLoadEntities,
          logging: databaseConfig.logging,
          namingStrategy: new SnakeNamingStrategy(),
          ssl: false,
        }
      },
    }),
  ],
})
export class DatabaseModule {}
