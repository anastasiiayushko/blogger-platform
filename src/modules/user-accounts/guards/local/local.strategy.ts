import { ExecutionContext, Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../../application/auth.service';
import { UserContextDto } from '../../decorators/param/user-context.dto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'loginOrEmail',
    });
  }

  canActivate(context: ExecutionContext) {
    // Add your custom authentication logic here
    // for example, call super.logIn(request) to establish a session.
    console.log('canActivate context', context);
  }

  handleRequest(err, user, info) {
    console.log('handleRequest');
    console.log(err, info);
  }

  async validate(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto> {
    console.log('Guard validate', loginOrEmail, password);
    const user = await this.authService.validateUser(loginOrEmail, password);
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
      });
    }
    return { id: user?.id ?? '1' };
  }
}
