import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from '../application/auth.service';
import { LocalAuthGuard } from '../guards/local/local-auth.guard';
import { ApiBody } from '@nestjs/swagger';
import { CurrentUserFormRequest } from '../decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../decorators/param/user-context.dto';
import { UserInputDTO } from './input-dto/users.input-dto';
import { UserService } from '../application/user.service';
import { UserQueryRepository } from '../infrastructure/query/users.query-repository';

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
  //swagger doc
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        login: { type: 'string', example: 'login123' },
        password: { type: 'string', example: 'superpassword' },
      },
    },
  })
  signIn(@CurrentUserFormRequest() user: UserContextDto): {
    accessToken: string;
  } {
    return this.authService.signIn(user.id);
  }

  @Post('/registration')
  async signUp(@Body() userInputDto: UserInputDTO) {
    const userId = await this.userService.createUser(userInputDto, false);
    return await this.userQueryRepository.findOrNotFoundFail(userId);
  }

  @Post('/logout')
  signOut() {
    return '/logout';
  }
}
