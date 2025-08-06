import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from '../../application/auth.service';
import { UserContextDto } from '../../decorators/param/user-context.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class BearerJwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_AT_SECRET') as string,
    });
  }

  async validate(payload: any): Promise<UserContextDto> {
    console.log('validaet', payload);
    return { id: payload.userId };
  }
}
