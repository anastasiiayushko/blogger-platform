import { INestApplication } from '@nestjs/common';
import { ResponseBodySuperTest } from '../../type/response-super-test';
import request from 'supertest';
import { SecurityDeviceViewDto } from '../../../src/modules/user-accounts/infrastructure/mapper/security-device.view-dto';

export class SecurityDevicesApiManager {
  private URL_PATH = '/api/security/devices';

  constructor(public app: INestApplication) {}

  async getAllDeviceSessions(
    cookies: string[],
  ): ResponseBodySuperTest<SecurityDeviceViewDto[]> {
    return await request(this.app.getHttpServer())
      .get(this.URL_PATH)
      .set('Cookie', cookies.join('; '));
  }

  async deleteAllOtherDeviceSessions(
    cookies: string[],
  ): ResponseBodySuperTest<null> {
    return await request(this.app.getHttpServer())
      .delete(this.URL_PATH)
      .set('Cookie', cookies.join('; '));
  }

  async deleteDeviceSessionByDeviceId(
    deviceId: string,
    cookies: string[],
  ): ResponseBodySuperTest<null> {
    return await request(this.app.getHttpServer())
      .delete(this.URL_PATH + '/' + deviceId)
      .set('Cookie', cookies.join('; '));
  }
}
