import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export enum PostQuerySortByEnum {
  createAt = 'createdAt',
  blogName = 'blogName',
  content = 'content',
  shortDescription = 'shortDescription',
  title = 'title'

}

export class GetPostQueryParams extends BaseQueryParams {
  @IsEnum(PostQuerySortByEnum)
  @IsOptional()
  @Type(() => String)
  sortBy: PostQuerySortByEnum = PostQuerySortByEnum.createAt;
}
