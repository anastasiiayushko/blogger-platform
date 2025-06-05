import request from 'supertest';
import { INestApplication } from '@nestjs/common';

export const deleteAllData = async (app: INestApplication) => {
  return request(app.getHttpServer()).delete(`/api/testing/all-data`).expect(204);
};
