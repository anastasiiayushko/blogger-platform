import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { UserViewDto } from '../../src/modules/user-accounts/api/view-dto/users.view-dto';
import { UsersRepository } from '../../src/modules/user-accounts/infrastructure/users.repository';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import * as mongoose from 'mongoose';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';

describe('UserController DELETE (e2e) ', () => {
  const basicAuth = getAuthHeaderBasicTest();

  let app: INestApplication;
  let userRepository: UsersRepository;
  let userTestManger: UsersApiManagerHelper;
  let createdUser: UserViewDto;

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    userRepository = app.get<UsersRepository>(UsersRepository);
    const userRes = await userTestManger.createUser(
      {
        email: 'test@test.com',
        password: 'password',
        login: 'login',
      },
      basicAuth,
    );
    expect(userRes.status).toBe(HttpStatus.CREATED);
    createdUser = userRes.body;
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should return 401 if invalid header basic auth', async () => {
    const response = await userTestManger.deleteById(createdUser.id, '');
    expect(response.status).toBe(HttpStatus.UNAUTHORIZED);

    const user = await userRepository.findById(createdUser.id);
    expect(user).not.toBeNull();
  });

  it('Should be return 404 error if user by id not found', async () => {
    const response = await userTestManger.deleteById(
      new mongoose.Types.ObjectId().toString(),
      basicAuth,
    );
    expect(response.status).toBe(HttpStatus.NOT_FOUND);
  });
  it('Should be 204 deleted existing user by id', async () => {
    const response = await userTestManger.deleteById(createdUser.id, basicAuth);
    expect(response.status).toBe(HttpStatus.NO_CONTENT);

    const user = await userRepository.findById(createdUser.id);
    expect(user).toBeNull();
  });

  it('Should be 400 if param not valid objectId type', async () => {
    const response = await userTestManger.deleteById('randomid', basicAuth);
    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
  });
});
