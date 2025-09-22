import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { UsersSqlRepository } from '../../src/modules/user-accounts/infrastructure/sql/users.sql-repository';
import { EmailConfirmationSqlRepository } from '../../src/modules/user-accounts/infrastructure/sql/email-confirmation.sql-repository';
import { EmailConfirmation } from '../../src/modules/user-accounts/domin/sql-entity/email-confirmation.sql-entity';
import { User } from '../../src/modules/user-accounts/domin/sql-entity/user.sql-entity';
import { ThrottlerConfig } from '../../src/core/config/throttler.config';

describe('Auth /registration', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL_REGISTRATION = '/api/auth/registration';
  let app: INestApplication;
  let throttlerConfig: ThrottlerConfig;
  let userTestManger: UsersApiManagerHelper;
  let userRepository: UsersSqlRepository;
  let emailConfirmationRepository: EmailConfirmationSqlRepository;

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
    userRepository = app.get<UsersSqlRepository>(UsersSqlRepository);
    emailConfirmationRepository = app.get<EmailConfirmationSqlRepository>(
      EmailConfirmationSqlRepository,
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

    const EmailConfirmation = (await emailConfirmationRepository.findByUserId(
      User!.id as string,
    )) as unknown as EmailConfirmation;

    expect(EmailConfirmation.isConfirmed).toBeFalsy();
    expect(typeof EmailConfirmation.code).toBe('string');
    expect(EmailConfirmation.expirationAt).toBeInstanceOf(Date);
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

  it('Should be return 400  if the  login no exists ', async () => {
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

  it('Should return 429 if more than 5 requests in 10 seconds', async () => {
    if (throttlerConfig.enabled) {
      for (let i = 0; i < 5; i++) {
        await userTestManger.registrationUser(newUser); // Или другой эндпоинт
      }

      // Делаем еще один запрос, чтобы превысить лимит
      const res = await userTestManger.registrationUser(newUser);

      // Проверяем, что статус 429 (слишком много запросов)
      expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    } else {
      console.info('ThrottlerConfig off');
    }
  });
});
