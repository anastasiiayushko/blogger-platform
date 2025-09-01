import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeModelType } from '../../domain/like.entety';
import { FlattenMaps, Types } from 'mongoose';
import { LikeQueryViewDto } from './dto/like-query.view-dto';

@Injectable()
export class LikeQueryRepository {
  constructor(@InjectModel(Like.name) protected likeModel: LikeModelType) {}

  async findByParentAndAuthor(
    parentId: string,
    authorId: string,
  ): Promise<LikeQueryViewDto | null> {
    if (!authorId) return null;
    const like = await this.likeModel
      .findOne(
        {
          parentId: new Types.ObjectId(parentId),
          authorId: new Types.ObjectId(authorId),
        },
        { parentId: 1, status: 1, authorId: 1 },
      )
      .lean();
    return like ? like : null;
  }

  async findAllByParentIdWithAuthor(
    parentIds: Types.ObjectId[],
    authorId: Types.ObjectId,
  ): Promise<LikeQueryViewDto[] | null> {
    const likes = await this.likeModel
      .find(
        {
          parentId: { $in: parentIds },
          authorId: authorId,
        },
        { parentId: 1, status: 1, authorId: 1 },
      )
      .lean();
    return likes && likes?.length ? likes : null;
  }
}
