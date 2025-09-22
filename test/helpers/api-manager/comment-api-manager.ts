import { INestApplication } from '@nestjs/common';

export class CommentApiManager {
  private URL_PATH = '/api/comments';
  private URL_PATH_WITH_POST = '/api/posts';

  constructor(private app: INestApplication) {}
}
