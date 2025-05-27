import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from './user-context.dto';

export const CurrentUserFormRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto => {
    const request = context.switchToHttp().getRequest();
    const currentUser = request.user;
    if (!currentUser) {
      throw new Error(`user undefined`);
    }
    return currentUser;
  },
);
