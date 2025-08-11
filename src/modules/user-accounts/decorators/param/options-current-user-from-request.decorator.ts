import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserContextDto } from './user-context.dto';

export const OptionalCurrentUserFormRequest = createParamDecorator(
  (data: unknown, context: ExecutionContext): UserContextDto | null => {
    const request = context.switchToHttp().getRequest();
    const currentUser = request?.user ?? null;

    return currentUser;
  },
);
