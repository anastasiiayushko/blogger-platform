import { IsEnum } from 'class-validator';
import { LikeStatusEnum } from '../types/like-status.enum';

export class LikeStatusInputDto {
  @IsEnum(LikeStatusEnum)
  likeStatus: LikeStatusEnum;
}
