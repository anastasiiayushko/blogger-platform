import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

enum SortByComment {
  content = 'content',
  createdAt = 'createdAt',
}

export class GetCommentsQueryParams extends BaseQueryParams {
  @IsEnum(SortByComment)
  @IsOptional()
  @Type(() => String)
  sortBy: SortByComment = SortByComment.createdAt;
}
