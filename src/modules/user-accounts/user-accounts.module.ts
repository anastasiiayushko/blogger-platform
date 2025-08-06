import { Module } from '@nestjs/common';
import { UserController } from './api/user.controller';
import { UserService } from './application/user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domin/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UserQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { LocalStrategy } from './guards/local/local.strategy';
import { CryptoService } from './application/crypto.service';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreateUserService } from './application/create-user-service';
import { BearerJwtStrategy } from './guards/bearer/bearer-jwt.strategy';
import { BasicAuthGuard } from './guards/basic/basic-auth.guard';
import { UsersExternalQueryRepository } from './infrastructure/query/users-external.query-repository';

@Module({
  imports: [
    NotificationsModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_AT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_AT_EXPIRES'),
        },
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]), // локально подключаем сущности
  ],
  controllers: [UserController, AuthController],
  providers: [
    CreateUserService,
    UserService,
    UsersRepository,
    UserQueryRepository,
    AuthService,
    CryptoService,
    LocalStrategy,
    BearerJwtStrategy,
    UsersExternalQueryRepository,
  ],
  exports: [BearerJwtStrategy, UsersExternalQueryRepository],
})
export class UserAccountsModule {}
