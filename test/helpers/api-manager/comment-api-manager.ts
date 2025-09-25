import { INestApplication } from '@nestjs/common';
import { CommentViewDTO } from '../../../src/modules/bloggers-platform/comments/infrastructure/mapper/comment.view-dto';
import request from 'supertest';
import { ResponseBodySuperTest } from '../../type/response-super-test';
import { CommentInputDto } from '../../../src/modules/bloggers-platform/comments/api/input-dto/comment.input-dto';
import { LikeStatusEnum } from '../../../src/core/types/like-status.enum';

export class CommentApiManager {
  private urlPath = '/api/comments';
  private urlPostPath = '/api/posts';

  constructor(private app: INestApplication) {}

  async updateComment(
    commentId: string,
    dto: CommentInputDto,
    accessToken: string,
  ): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .put(`${this.urlPath}/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        content: dto.content,
      });
  }

  async deleteCommentById(
    commentId: string,
    accessToken: string,
  ): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .delete(`${this.urlPath}/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  async findById(
    commentId: string,
    accessToken: string = '',
  ): Promise<ResponseBodySuperTest<CommentViewDTO>> {
    return request(this.app.getHttpServer())
      .get(`${this.urlPath}/${commentId}`)
      .set('Authorization', `Bearer ${accessToken}`);
  }

  async setLikeStatus(
    commentId: string,
    status: LikeStatusEnum,
    accessToken: string,
  ): Promise<ResponseBodySuperTest<void>> {
    return request(this.app.getHttpServer())
      .put(`${this.urlPath}/${commentId}/like-status`)
      .send({ likeStatus: status })
      .set('Authorization', `Bearer ${accessToken}`);
  }
}
