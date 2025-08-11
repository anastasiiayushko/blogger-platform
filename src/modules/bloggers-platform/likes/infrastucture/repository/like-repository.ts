import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeModelType } from '../../domain/like.entety';
import { Types } from 'mongoose';
import { LikeStatusEnum } from '../../domain/like-status.enum';
import { SortDirection } from '../../../../../core/dto/base.query-params.input-dto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LikeRepository {
  constructor(@InjectModel(Like.name) protected likeModel: LikeModelType) {}

  async findByParentsAndAuthor(
    parentId: string[] | string,
    authorId: string,
  ): Promise<LikeDocument[] | null> {
    const transformIds = Array.isArray(parentId)
      ? parentId.map((id) => new Types.ObjectId(id))
      : new Types.ObjectId(parentId);

    return await this.likeModel.find({
      parentId: { $in: transformIds },
      authorId: new Types.ObjectId(authorId),
    });
  }

  async save(entity: LikeDocument): Promise<void> {
    await entity.save();
  }

  async getCountersByParentIdAndStatus(
    parentId: string,
    status: LikeStatusEnum,
  ): Promise<number> {
    return await this.likeModel.countDocuments({
      parentId: new Types.ObjectId(parentId),
      status: status,
    });
  }

  async getNewestLikesByParentId(
    parentId: string,
    limit = 3,
  ): Promise<LikeDocument[]> {
    return await this.likeModel
      .find({
        parentId: new Types.ObjectId(parentId),
        status: LikeStatusEnum.Like,
      })
      .sort({ createdAt: SortDirection.Desc })
      .limit(limit);
  }
}
