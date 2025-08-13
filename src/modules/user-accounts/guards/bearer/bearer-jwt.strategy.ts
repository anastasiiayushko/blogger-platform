import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UserContextDto } from '../../decorators/param/user-context.dto';
import { UserAccountConfig } from '../../config/user-account.config';

@Injectable()
export class BearerJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userAccountConfig: UserAccountConfig) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: userAccountConfig.assessTokenSecret,
    });
  }

  async validate(payload: any): Promise<UserContextDto> {
    return { id: payload.userId };
  }
}
