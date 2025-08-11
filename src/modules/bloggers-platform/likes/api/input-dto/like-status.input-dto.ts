import { LikeStatusEnum } from '../../domain/like-status.enum';
import { IsEnum } from 'class-validator';

export class LikeStatusInputDto {
  @IsEnum(LikeStatusEnum)
  likeStatus: LikeStatusEnum;
}
