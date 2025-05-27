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

@Module({
  imports: [
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
    UserService,
    UsersRepository,
    UserQueryRepository,
    AuthService,
    LocalStrategy,
    CryptoService,
  ],
})
export class UserAccountsModule {}
