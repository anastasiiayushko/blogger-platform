import { Types } from 'mongoose';
import { LikeStatusEnum } from '../../../domain/like-status.enum';

export class LikeQueryViewDto {
  _id: Types.ObjectId;
  parentId: Types.ObjectId;
  status: LikeStatusEnum;
}
