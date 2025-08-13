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
import { AuthService } from '../application/auth.service';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiResponse } from '@nestjs/swagger';
import { CurrentUserFormRequest } from '../decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../decorators/param/user-context.dto';
import { UserQueryRepository } from '../infrastructure/query/users.query-repository';
import { AuthCodeInputDto } from './input-dto/auth-code.input-dto';
import { EmailInputDto } from './input-dto/email.input-dto';
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

@Controller('auth')
export class AuthController {
  constructor(
    protected authService: AuthService,
    protected userQueryRepository: UserQueryRepository,
    protected commandBus: CommandBus,
  ) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(
    @UserAgentAndIpParam() agentAndIp: UserAgentAndIpDto,
    @CurrentUserFormRequest() user: UserContextDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenViewDto> {
    const result = await this.commandBus.execute<AuthLoginCommand>(
      new AuthLoginCommand(user.id, agentAndIp.ip, agentAndIp.userAgent),
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: result.accessToken };
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
    const result = await this.commandBus.execute<AuthRefreshTokenCommand>(
      new AuthRefreshTokenCommand({
        userId: refreshTokenPayload.userId,
        deviceId: refreshTokenPayload.deviceId,
        ip: agentAndIp.ip,
        agent: agentAndIp.userAgent,
      }),
    );
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: true,
    });
    return { accessToken: result.accessToken };
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
  async registration(@Body() userInputDto: CreateUsersInputDto) {
    return await this.authService.registration(userInputDto);
  }

  @Post('/registration-confirmation')
  @HttpCode(HttpStatus.NO_CONTENT)
  async registrationConfirmEmail(@Body() confirmCodeDto: AuthCodeInputDto) {
    await this.authService.confirmEmailByCode(confirmCodeDto.code);
  }

  @Post('/registration-email-resending')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recoverEmailConfirm(@Body() emailDto: EmailInputDto) {
    await this.authService.recoverEmailConfirm(emailDto.email);
  }

  @Post('/password-recovery')
  @HttpCode(HttpStatus.NO_CONTENT)
  async recoverPassword(@Body() emailDto: EmailInputDto) {
    await this.authService.recoverPassword(emailDto.email);
  }

  @Post('/new-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePassword(
    @Body() newPassRecoveryDto: NewPasswordRecoveryInputDto,
  ) {
    await this.authService.updatePassword(newPassRecoveryDto);
  }

  @Get('/me')
  @UseGuards(BearerJwtAuthGuard)
  @SkipThrottle()
  async me(@CurrentUserFormRequest() user: UserContextDto) {
    return await this.userQueryRepository.getUserMeById(user.id);
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
