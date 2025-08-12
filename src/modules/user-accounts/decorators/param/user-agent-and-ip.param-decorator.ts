import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class UserAgentAndIpDto {
  ip: string;
  userAgent: string;
}

export const UserAgentAndIpParam = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserAgentAndIpDto => {
    const request = ctx.switchToHttp().getRequest();
    const forwarded = request.headers['x-forwarded-for'] as string;

    const ip = forwarded?.split(',')[0].trim() || request.socket.remoteAddress;
    const userAgent = request.headers['user-agent'];

    return { ip, userAgent };
  },
);
