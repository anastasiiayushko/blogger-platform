import { SaCreateUserHandler } from '../../../src/modules/user-accounts/application/sa-users-usecases/sa-create-user.usecase';
import { INestApplication } from '@nestjs/common';

export const makeSaCreateUserHelper = (app: INestApplication) => {
  let v = 6;
  const saCreateUserHandler = app.get(SaCreateUserHandler);

  return async (): Promise<string> => {
    const userId = await saCreateUserHandler.execute({
      login: 'player' + v,
      email: `player${v}@example.com`,
      password: `player${v}`,
    });
    v++;
    return userId;
  };
};
