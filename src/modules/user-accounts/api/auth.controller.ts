import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBasicAuth, ApiBody, ApiResponse } from '@nestjs/swagger';
import { CurrentUserFormRequest } from '../decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../decorators/param/user-context.dto';
import { AuthCodeInputDto } from './input-dto/auth-code.input-dto';
import { EmailInputModelDto } from './input-dto/email-input-model.dto';
import { NewPasswordRecoveryInputDto } from './input-dto/new-password-recovery.input-dto';
import { CreateUsersInputDto } from './input-dto/create-users.input-dto';
import { BearerJwtAuthGuard } from '../guards/bearer/bearer-jwt-auth.guard';
import { AccessTokenViewDto } from './view-dto/access-token.view-dto';
import { CommandBus } from '@nestjs/cqrs';
import { AuthLoginCommand } from '../application/auth-usecases/auth-login.usecase';
import {
  UserAgentAndIpDto,
  UserAgentAndIpParam,
} from '../decorators/param/user-agent-and-ip.param-decorator';
import { RefreshTokenAuthGuard } from '../guards/refresh-token/refresh-token-auth.guard';
import {
  RefreshTokenPayloadDto,
  RefreshTokenPayloadFromRequest,
} from '../decorators/param/refresh-token-payload-from-request.decorators';
import { AuthRefreshTokenCommand } from '../application/auth-usecases/auth-refresh-token.usecase';
import { AuthLogoutCommand } from '../application/auth-usecases/auth-logout.usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { PasswordRecoveryCommand } from '../application/auth-usecases/auth-password-recovery.usecase';
import { UpdatePasswordCommand } from '../application/auth-usecases/update-password.usecase';
import { RegistrationConfirmationCommand } from '../application/auth-usecases/registration-confirmation.usecase';
import { RegistrationUserCommand } from '../application/auth-usecases/registration-user.usecase';
import { RegistrationEmailResendingCommand } from '../application/auth-usecases/registration-email-resending.usecase';
import { UserQueryRepository } from '../infrastructure/query/user-query-repositroy';
import { UserMeViewDto } from '../infrastructure/mapper/user-me-view-dto';
import { LoginInputDto } from './input-dto/login.input-dto';

type PairTokenType = {
  accessToken: string;
  refreshToken: string;
};

@Controller('auth')
export class AuthController {
  constructor(
    protected userQueryRepository: UserQueryRepository,
    protected commandBus: CommandBus,
  ) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  @ApiBody({
    type: LoginInputDto,
  })
  async login(
    @UserAgentAndIpParam() agentAndIp: UserAgentAndIpDto,
    @CurrentUserFormRequest() user: UserContextDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenViewDto> {
    const pairToken = await this.commandBus.execute<
      AuthLoginCommand,
      PairTokenType
    >(new AuthLoginCommand(user.id, agentAndIp.ip, agentAndIp.userAgent));
    res.cookie('refreshToken', pairToken.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: pairToken.accessToken };
  }

  @Post('/refresh-token')
  @UseGuards(RefreshTokenAuthGuard)
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @UserAgentAndIpParam() agentAndIp: UserAgentAndIpDto,
    @RefreshTokenPayloadFromRequest()
    refreshTokenPayload: RefreshTokenPayloadDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenViewDto> {
    const pairToken = await this.commandBus.execute<
      AuthRefreshTokenCommand,
      PairTokenType
    >(
      new AuthRefreshTokenCommand({
        userId: refreshTokenPayload.userId,
        deviceId: refreshTokenPayload.deviceId,
        ip: agentAndIp.ip,
        agent: agentAndIp.userAgent,
      }),
    );
    res.cookie('refreshToken', pairToken.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: pairToken.accessToken };
  }

  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The record has been successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'If the inputModel has incorrect values',
  })
  @Post('/registration')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registration(@Body() userInputDto: CreateUsersInputDto): Promise<void> {
    await this.commandBus.execute<RegistrationUserCommand>(
      new RegistrationUserCommand(userInputDto),
    );
    return;
  }

  @Post('/registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmEmail(@Body() codeInputDto: AuthCodeInputDto) {
    await this.commandBus.execute<RegistrationConfirmationCommand>(
      new RegistrationConfirmationCommand(codeInputDto.code),
    );
    return;
  }

  @Post('/registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recoverEmailConfirm(@Body() inputModel: EmailInputModelDto) {
    await this.commandBus.execute<RegistrationEmailResendingCommand>(
      new RegistrationEmailResendingCommand(inputModel.email),
    );
    return;
  }

  @Post('/password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recoverPassword(@Body() inputModel: EmailInputModelDto) {
    // await this.authService.recoverPassword(inputModel.email);
    await this.commandBus.execute<PasswordRecoveryCommand>(
      new PasswordRecoveryCommand(inputModel.email),
    );
  }

  @Post('/new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(@Body() inputDto: NewPasswordRecoveryInputDto) {
    await this.commandBus.execute<UpdatePasswordCommand>(
      new UpdatePasswordCommand(inputDto.recoveryCode, inputDto.newPassword),
    );
    return;
    // await this.authService.updatePassword(newPassRecoveryDto);
  }

  @Get('/me')
  @UseGuards(BearerJwtAuthGuard)
  @SkipThrottle()
  async me(
    @CurrentUserFormRequest() user: UserContextDto,
  ): Promise<UserMeViewDto> {
    return this.userQueryRepository.getUserMeById(user.id);
  }

  @Post('/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(RefreshTokenAuthGuard)
  @SkipThrottle()
  async signOut(
    @RefreshTokenPayloadFromRequest() payload: RefreshTokenPayloadDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<void> {
    res.clearCookie('refreshToken');
    await this.commandBus.execute<AuthLogoutCommand>(
      new AuthLogoutCommand(payload.deviceId, payload.userId),
    );
    return;
  }
}
