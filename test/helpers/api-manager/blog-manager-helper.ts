import { INestApplication } from '@nestjs/common';
import { BlogInputDto } from '../../../src/modules/bloggers-platform/blogs/api/input-dto/blog.input-dto';
import request from 'supertest';
import { getAuthHeaderBasicTest } from '../common-helpers';

export class BlogManagerHelper {
  private urlPath = '/api/blog';

  constructor(private app: INestApplication) {}

  async createBlog(
    inputDto: BlogInputDto,
    basicAuth: string = getAuthHeaderBasicTest(),
  ) {
    return await request(this.app.getHttpServer())
      .post(this.urlPath)
      .set('Authorization', basicAuth)
      .send(inputDto);
  }
}
