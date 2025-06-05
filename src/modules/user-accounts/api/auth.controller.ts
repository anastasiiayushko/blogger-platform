import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBody, ApiResponse } from '@nestjs/swagger';
import { CurrentUserFormRequest } from '../decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../decorators/param/user-context.dto';
import { UserService } from '../application/user.service';
import { UserQueryRepository } from '../infrastructure/query/users.query-repository';
import { AuthCodeInputDto } from './input-dto/auth-code.input-dto';
import { EmailInputDto } from './input-dto/email.input-dto';
import { NewPasswordRecoveryInputDto } from './input-dto/new-password-recovery.input-dto';
import { CreateUsersInputDto } from './input-dto/create-users.input-dto';
import { BearerJwtAuthGuard } from '../guards/bearer/bearer-jwt-auth.guard';
import { AccessTokenViewDto } from './view-dto/access-token.view-dto';

@Controller('auth')
export class AuthController {
  constructor(
    protected authService: AuthService,
    protected userService: UserService,
    protected userQueryRepository: UserQueryRepository,
  ) {}

  @Post('/login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  login(@CurrentUserFormRequest() user: UserContextDto): AccessTokenViewDto {
    return this.authService.login(user.id);
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

  @UseGuards(BearerJwtAuthGuard)
  @Get('/me')
  async me(@CurrentUserFormRequest() user: UserContextDto) {
    return await this.userQueryRepository.getUserMeById(user.id);
  }

  @Post('/logout')
  signOut() {
    return '/logout';
  }
}
