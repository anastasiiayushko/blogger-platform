import { Injectable } from '@nestjs/common';
import { Types } from 'mongoose';
import { LikeStatusEnum } from '../../domain/like-status.enum';
import { LikeRepository } from '../../infrastucture/repository/like-repository';
import { LikeDocument } from '../../domain/like.entety';

@Injectable()
export class LikeMapQueryService {
  constructor(protected likeRepo: LikeRepository) {}

  async getStatusLikesMapByParams(
    parentIds: string[],
    userId: string | null | undefined,
  ): Promise<Map<string, LikeStatusEnum>> {
    const statusMap = new Map<string, LikeStatusEnum>();
    if (!parentIds?.length || !userId) return statusMap;

    const likesDoc = await this.likeRepo.findByParentsAndAuthor(
      parentIds,
      userId,
    );

    if (likesDoc) {
      for (const like of likesDoc) {
        statusMap.set(like.parentId.toString(), like.status);
      }
    }

    return statusMap;
  }
}
