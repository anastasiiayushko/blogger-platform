import { HttpStatus, INestApplication } from '@nestjs/common';
import { initSettings } from '../helpers/init-setting';
import { getAuthHeaderBasicTest } from '../helpers/common-helpers';
import request from 'supertest';
import { UsersApiManagerHelper } from '../helpers/api-manager/users-api-manager-helper';
import { PasswordRecoverySqlRepository } from '../../src/modules/user-accounts/infrastructure/sql/password-recovery.sql-repository';
import { EmailPasswordRecoveryHandler } from '../../src/modules/notifications/event-usecases/email-password-recovery.event-usecase';

describe('Auth /password-recovery', () => {
  const basicAuth = getAuthHeaderBasicTest();
  const PATH_URL = '/api/auth/password-recovery';
  let app: INestApplication;
  let userTestManger: UsersApiManagerHelper;
  let passwordRecoveryRepository: PasswordRecoverySqlRepository;
  let registeredUserId: string;
  let emailPasswordRecoveryHandler: EmailPasswordRecoveryHandler;

  const infoRegisteredUser = {
    email: 'supertest@gmail.com',
    login: 'supertest',
    password: 'supertest123456',
  };

  beforeAll(async () => {
    const init = await initSettings();
    app = init.app;
    userTestManger = init.userTestManger;
    passwordRecoveryRepository = app.get<PasswordRecoverySqlRepository>(
      PasswordRecoverySqlRepository,
    );
    emailPasswordRecoveryHandler = app.get<EmailPasswordRecoveryHandler>(
      EmailPasswordRecoveryHandler,
    );
    const createdUserRes = await userTestManger.createUser(
      infoRegisteredUser,
      basicAuth,
    );
    expect(createdUserRes.status).toBe(HttpStatus.CREATED);
    expect(createdUserRes.body.id).toBeDefined();
    registeredUserId = createdUserRes.body.id as string;
  });

  afterAll(async () => {
    await app.close();
  });

  it('Should be return 204 user existing in system and recovery password to send ', async () => {
    const recovery = await request(app.getHttpServer())
      .post(PATH_URL)
      .send({ email: infoRegisteredUser.email });
    expect(recovery.status).toBe(HttpStatus.NO_CONTENT);
    expect(recovery.body).toEqual({});
    //::TODO провека вызова хендлера
    // const spyHandle = jest.spyOn(emailPasswordRecoveryHandler, 'handle');
    // expect(spyHandle).toHaveBeenCalled();

    const passwordRecovery =
      await passwordRecoveryRepository.findByUserId(registeredUserId);
    expect(passwordRecovery!.isConfirmed).toBeFalsy();
  });

  it('Should be return 400 if inputModel has invalid email ', async () => {
    const recovery = await request(app.getHttpServer())
      .post(PATH_URL)
      .send({ email: `test345test.com` });

    expect(recovery.status).toBe(HttpStatus.BAD_REQUEST);

    expect(recovery.body).toEqual({
      errorsMessages: [
        { field: expect.any(String), message: expect.any(String) },
      ],
    });
    const passwordRecovery =
      await passwordRecoveryRepository.findByUserId(registeredUserId);
    expect(passwordRecovery!.isConfirmed).toBeFalsy();
  });

  it("Should be return 204 if if current email is not registered  (for prevent user's email detection)", async () => {
    const recovery = await request(app.getHttpServer())
      .post(PATH_URL)
      .send({ email: `unused@email.com` });

    expect(recovery.status).toBe(HttpStatus.NO_CONTENT);
    const passwordRecovery =
      await passwordRecoveryRepository.findByUserId(registeredUserId);
    expect(passwordRecovery!.isConfirmed).toBeFalsy();
  });

  it('Should be return 429 (brute-force) if More than 5 attempts from one IP-address during 10 seconds', async () => {
    await Promise.all(
      Array.from({ length: 5 }, (_, i) => {
        const email = `guess${i}@example.com`;
        return request(app.getHttpServer()).post(PATH_URL).send({ email });
      }),
    );
    const rejectRes = await request(app.getHttpServer())
      .post(PATH_URL)
      .send({ email: `unused@email.com` });

    expect(rejectRes.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
  });
});
