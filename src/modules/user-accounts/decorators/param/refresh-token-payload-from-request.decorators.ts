import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export class RefreshTokenPayloadDto {
  userId: string;
  deviceId: string;
  iat: number;
}

export const RefreshTokenPayloadFromRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): RefreshTokenPayloadDto => {
    const request = context.switchToHttp().getRequest();
    const payload = request?.refreshTokenPayload;
    if (!payload) {
      throw new Error(`refresh token payload undefined`);
    }
    return {
      userId: payload.userId,
      deviceId: payload.deviceId,
      iat: payload.iat,
    };
  },
);
