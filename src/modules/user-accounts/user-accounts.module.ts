import { Module } from '@nestjs/common';
import { AuthController } from './api/auth.controller';
import { AuthService } from './application/auth.service';
import { LocalStrategy } from './guards/local/local.strategy';
import { CryptoService } from './application/crypto.service';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { NotificationsModule } from '../notifications/notifications.module';
import { CreateUserService } from './application/create-user-service';
import { BearerJwtStrategy } from './guards/bearer/bearer-jwt.strategy';
import { UserAccountConfig } from './config/user-account.config';
import {
  ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
} from './constants/auth-tokens.inject-constants';
import { RefreshTokenAuthGuard } from './guards/refresh-token/refresh-token-auth.guard';
import { SecurityDevicesController } from './api/security-devices.controller';
import { UserConfirmationConfig } from './config/user-confirmation.config';
import { SaUsersController } from './api/sa-users.controller';
import { SaCreateUserHandler } from './application/sa-users-usecases/sa-create-user.usecase';
import { SaDeleteUserHandler } from './application/sa-users-usecases/sa-delete-user.usecase';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserRepository } from './infrastructure/user-repository';
import { User } from './domin/user.entity';
import { UserQueryRepository } from './infrastructure/query/user-query-repositroy';
import { EmailConfirmation } from './domin/email-confirmation.entity';
import { EmailConfirmationRepository } from './infrastructure/email-confirmation.repository';
import { SessionDevice } from './domin/session-device.entity';
import { SessionDeviceRepository } from './infrastructure/session-device.repository';
import { SessionDeviceQueryRepository } from './infrastructure/query/session-device.query-repository';
import { AuthLoginHandler } from './application/auth-usecases/auth-login.usecase';
import { AuthRefreshTokenHandler } from './application/auth-usecases/auth-refresh-token.usecase';
import { AuthLogoutHandler } from './application/auth-usecases/auth-logout.usecase';
import { PasswordRecovery } from './domin/password-recovery.entity';
import { PasswordRecoveryHandler } from './application/auth-usecases/auth-password-recovery.usecase';
import { PasswordRecoveryRepository } from './infrastructure/password-recovery.repository';
import { UpdatePasswordCommandHandler } from './application/auth-usecases/update-password.usecase';
import { DeleteDeviceByIdHandler } from './application/security-devices-usecases/delete-device-by-id.usecase';
import { TerminateAllOtherDevicesHandler } from './application/security-devices-usecases/terminate-current-device.usecase';
import { RegistrationConfirmationCommandHandler } from './application/auth-usecases/registration-confirmation.usecase';
import { RegistrationUserHandler } from './application/auth-usecases/registration-user.usecase';
import { RegistrationEmailResendingHandler } from './application/auth-usecases/registration-email-resending.usecase';
import { UserExternalQueryRepository } from './infrastructure/external-query/user-external.query-repository';

const cmdHandlerSecurityDevice = [
  DeleteDeviceByIdHandler,
  TerminateAllOtherDevicesHandler,
];
const cmdHandlerAuth = [
  AuthLoginHandler,
  AuthRefreshTokenHandler,
  AuthLogoutHandler,
  PasswordRecoveryHandler,
  UpdatePasswordCommandHandler,
  RegistrationConfirmationCommandHandler,
  RegistrationUserHandler,
  RegistrationEmailResendingHandler,
];

const cmdSaHandlerUser = [SaCreateUserHandler, SaDeleteUserHandler];
const configs = [UserAccountConfig, UserConfirmationConfig];

// const sqlExternalQueryRepository = [UsersExternalQuerySqlRepository];

@Module({
  imports: [
    NotificationsModule,
    JwtModule,
    TypeOrmModule.forFeature([
      User,
      EmailConfirmation,
      SessionDevice,
      PasswordRecovery,
    ]),
    // MongooseModule.forFeature([
    //   {
    //     name: User_root.name,
    //     schema: UserSchema,
    //   },
    //   {
    //     name: SecurityDevice.name,
    //     schema: SecurityDeviceSchema,
    //   },
    // ]), // локально подключаем сущности
  ],
  controllers: [AuthController, SecurityDevicesController, SaUsersController],
  providers: [
    CreateUserService,
    AuthService,
    CryptoService,
    LocalStrategy,
    BearerJwtStrategy,
    RefreshTokenAuthGuard,
    UserRepository,
    UserQueryRepository,
    UserExternalQueryRepository,
    EmailConfirmationRepository,
    SessionDeviceRepository,
    SessionDeviceQueryRepository,
    PasswordRecoveryRepository,
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
    UserExternalQueryRepository,
    /** при использование  guard через @UseGuard(nameGard),
     * можно не экспортировать поставщиков которые инжектируются в через конструктор
     *  Nest автоматически видит зависимости guard’а через импорт модуля
     * */
    // REFRESH_TOKEN_STRATEGY_INJECT_TOKEN,
    // ACCESS_TOKEN_STRATEGY_INJECT_TOKEN,
  ],
})
export class UserAccountsModule {}
