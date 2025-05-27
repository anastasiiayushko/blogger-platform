import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

enum SortByEnum {
  createAt = 'createdAt',
  blogId = 'blogId',
  blogName = 'blogName',
  content = 'content',
  shortDescription = 'shortDescription',
}

export class GetPostQueryParams extends BaseQueryParams {
  @IsEnum(SortByEnum)
  @IsOptional()
  @Type(() => String)
  sortBy: SortByEnum = SortByEnum.createAt;
}
