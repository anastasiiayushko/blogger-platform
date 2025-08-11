import { LikeStatusEnum } from '../like-status.enum';

export class CreateLikeDomainDto {
  authorId: string;
  authorName: string;
  parentId: string;
  status: LikeStatusEnum;
}
