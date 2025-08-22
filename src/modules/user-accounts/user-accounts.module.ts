import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './domin/user.entity';
import { UsersRepository } from './infrastructure/users.repository';
import { UserQueryRepository } from './infrastructure/query/users.query-repository';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { LocalStrategy } from './guards/local/local.strategy';
import { CryptoService } from './application/crypto.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreateUserService } from './application/create-user-service';
import { BearerJwtStrategy } from './guards/bearer/bearer-jwt.strategy';
import { UsersExternalQueryRepository } from './infrastructure/external-query/users-external.query-repository';
import { UserAccountConfig } from './config/user-account.config';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';
import {
  SecurityDevice,
  SecurityDeviceSchema,
} from './domin/security-device.entity';
import { SecurityDeviceRepository } from './infrastructure/security-device.repository';
import { AuthLoginHandler } from './application/auth-usecases/auth-login.usecase';
import { RefreshTokenAuthGuard } from './guards/refresh-token/refresh-token-auth.guard';
import { AuthRefreshTokenHandler } from './application/auth-usecases/auth-refresh-token.usecase';
import { AuthLogoutHandler } from './application/auth-usecases/auth-logout.usecase';
import { SecurityDevicesController } from './api/security-devices.controller';
import { CreateSecurityDeviceHandler } from './application/security-devices-usecases/create-security-device.usecase';
import { UpdateSecurityDeviceHandler } from './application/security-devices-usecases/update-security-device.usecase';
import { DeleteDeviceByIdHandler } from './application/security-devices-usecases/delete-device-by-id.usecase';
import { TerminateAllOtherDevicesHandler } from './application/security-devices-usecases/terminate-current-device.usecase';
import { SecurityDeviceQueryRepository } from './infrastructure/query/security-device.query-repository';
import { UserConfirmationConfig } from './config/user-confirmation.config';
import { SaUsersController } from './api/sa-users.controller';
import { UsersSqlRepository } from './infrastructure/sql/users.sql-repository';
import { UsersQuerySqlRepository } from './infrastructure/sql/query/users.query-sql-repository';
import { UsersExternalQuerySqlRepository } from './infrastructure/sql/external-query/users-external.query-sql-repository';
import { SaCreateUserHandler } from './application/sa-users-usecases/sa-create-user.usecase';
import { EmailConfirmationSqlRepository } from './infrastructure/sql/email-confirmation.sql-repository';
import { SaDeleteUserHandler } from './application/sa-users-usecases/sa-delete-user.usecase';

const cmdHandlerSecurityDevice = [
  CreateSecurityDeviceHandler,
  UpdateSecurityDeviceHandler,
  DeleteDeviceByIdHandler,
  TerminateAllOtherDevicesHandler,
];
const cmdHandlerAuth = [
  AuthLoginHandler,
  AuthRefreshTokenHandler,
  AuthLogoutHandler,
];

const cmdSaHandlerUser = [SaCreateUserHandler, SaDeleteUserHandler];
const configs = [UserAccountConfig, UserConfirmationConfig];

const mongooseRepository = [
  UsersRepository,
  UserQueryRepository,
  SecurityDeviceRepository,
  SecurityDeviceQueryRepository,
  UsersExternalQueryRepository,
];
const sqlRepository = [
  UsersSqlRepository,
  UsersQuerySqlRepository,
  UsersExternalQuerySqlRepository,
  EmailConfirmationSqlRepository,
];

@Module({
  imports: [
    NotificationsModule,
    JwtModule,
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: SecurityDevice.name,
        schema: SecurityDeviceSchema,
      },
    ]), // локально подключаем сущности
  ],
  controllers: [AuthController, SecurityDevicesController, SaUsersController],
  providers: [
    CreateUserService,
    AuthService,
    CryptoService,
    LocalStrategy,
    BearerJwtStrategy,
    RefreshTokenAuthGuard,
    ...mongooseRepository,
    ...sqlRepository,
    ...configs,
    ...cmdHandlerSecurityDevice,
    ...cmdHandlerAuth,
    ...cmdSaHandlerUser,
    //пример инстанцирования через токен
    //если надо внедрить несколько раз один и тот же класс
    {
      provide: ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.assessTokenSecret,
          signOptions: { expiresIn: userAccountConfig.assessTokenExpiresIn },
        });
      },
      inject: [UserAccountConfig],
    },
    {
      provide: REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
      useFactory: (userAccountConfig: UserAccountConfig): JwtService => {
        return new JwtService({
          secret: userAccountConfig.refreshTokenSecret,
          signOptions: { expiresIn: userAccountConfig.refreshTokenExpiresIn },
        });
      },
      inject: [UserAccountConfig],
    },
  ],
  exports: [
    BearerJwtStrategy,
    UsersExternalQueryRepository,
    /** при использование  guard через @UseGuard(nameGard), можно не экспортирована поставщиков которые инжектируются в через конструктор
     *  Nest автоматически видит зависимости guard’а через импорт модуля
     * */
    // REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
    // ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  ],
})
export class UserAccountsModule {}
