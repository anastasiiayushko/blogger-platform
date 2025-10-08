import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import {
  generateRandomStringForTest,
  getAuthHeaderBasicTest,
} from '../helpers/common-helpers';
import request from 'supertest';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { User } from '../../src/modules/user-accounts/domin/sql-entity/user.sql-entity';
import { ThrottlerConfig } from '../../src/core/config/throttler.config';
import { UserRepository } from '../../src/modules/user-accounts/infrastructure/user-repository';
import {
  EmailConfirmationRepository,
} from '../../src/modules/user-accounts/infrastructure/email-confirmation.repository';
import { EmailConfirmation } from '../../src/modules/user-accounts/domin/email-confirmation.entity';
import { loginConstraints } from '../../src/modules/user-accounts/domin/user.constraints';

//::TODO rewrite test
describe('Auth /registration', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL_REGISTRATION = '/api/auth/registration';
  let app: INestApplication;
  let throttlerConfig: ThrottlerConfig;
  let userTestManger: UsersApiManagerHelper;
  let userRepository: UserRepository;
  let emailConfirmationRepository: EmailConfirmationRepository;

  const existingUser = {
    email: 'test@test.com',
    login: 'test',
    password: 'test123456',
  };
  const newUser = {
    email: 'new@test.com',
    login: 'new-user',
    password: 'test123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    throttlerConfig = app.get<ThrottlerConfig>(ThrottlerConfig);
    userTestManger = init.userTestManger;
    userRepository = app.get<UserRepository>(UserRepository);
    emailConfirmationRepository = app.get<EmailConfirmationRepository>(
      EmailConfirmationRepository,
    );
    const userRes = await userTestManger.createUser(existingUser, basicAuth);
    expect(userRes.status).toBe(HttpStatus.CREATED);
  });
  afterAll(async () => {
    await app.close();
  });

  it('Should be return 204 Email with confirmation code will be send to passed email address', async () => {
    const registrationResponse = await request(app.getHttpServer())
      .post(PATH_URL_REGISTRATION)
      .send(newUser);

    expect(registrationResponse.status).toBe(HttpStatus.NO_CONTENT);

    const User = await userRepository.findByEmailOrLogin(newUser.email);
    expect(User).not.toBeNull();
    expect(User?.id).toBeDefined();

    const emailConfirmation = (await emailConfirmationRepository.findByUserId(
      User!.id as string,
    )) as unknown as EmailConfirmation;

    expect(emailConfirmation.isConfirmed).toBeFalsy();
    expect(typeof emailConfirmation.code).toBe('string');
    expect(emailConfirmation.expirationAt).toBeInstanceOf(Date);
  });

  it('Should be return 400  if the user with the given email  already exists, and not regenerate existing user confirmation code ', async () => {
    const UserExisting = (await userRepository.findByEmailOrLogin(
      existingUser.email,
    )) as unknown as User;

    const EmailConfirmationBeforeRegister =
      await emailConfirmationRepository.findByUserId(UserExisting.id as string);

    const registrationResponse = await request(app.getHttpServer())
      .post(PATH_URL_REGISTRATION)
      .send({
        email: existingUser.email,
        login: 'new-user-login',
        password: 'password123',
      });

    expect(registrationResponse.status).toBe(HttpStatus.BAD_REQUEST);
    expect(registrationResponse.body.errorsMessages).toEqual([
      { field: expect.any(String), message: expect.any(String) },
    ]);

    const EmailConfirmationAfterRegister =
      await emailConfirmationRepository.findByUserId(UserExisting.id as string);

    expect(EmailConfirmationBeforeRegister!.code).toBe(
      EmailConfirmationAfterRegister!.code,
    );
  });

  it('Should be return 400  if the login no exists ', async () => {
    const res = await request(app.getHttpServer())
      .post(PATH_URL_REGISTRATION)
      .send({
        email: 'new@test.com',
        login: existingUser.login,
        password: 'password123',
      });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.errorsMessages).toEqual([
      { field: expect.any(String), message: expect.any(String) },
    ]);
  });
  it('Should be return 400  if the email incorrect ', async () => {
    const res = await request(app.getHttpServer())
      .post(PATH_URL_REGISTRATION)
      .send({
        email: 'new)@test.sdflom',
        login: existingUser.login,
        password: 'password123',
      });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.errorsMessages).toEqual([
      { field: expect.any(String), message: expect.any(String) },
    ]);
  });
  it('Should be return 400  if the login less or more Length ', async () => {
    const res = await request(app.getHttpServer())
      .post(PATH_URL_REGISTRATION)
      .send({
        email: 'new@test.com',
        login: generateRandomStringForTest(loginConstraints.minLength - 1),
        password: 'password123',
      });
    expect(res.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res.body.errorsMessages).toEqual([
      { field: expect.any(String), message: expect.any(String) },
    ]);

    const res2 = await request(app.getHttpServer())
      .post(PATH_URL_REGISTRATION)
      .send({
        email: 'new@test.com',
        login: generateRandomStringForTest(loginConstraints.maxLength + 1),
        password: 'password123',
      });
    expect(res2.status).toBe(HttpStatus.BAD_REQUEST);
    expect(res2.body.errorsMessages).toEqual([
      { field: expect.any(String), message: expect.any(String) },
    ]);
  });

});
