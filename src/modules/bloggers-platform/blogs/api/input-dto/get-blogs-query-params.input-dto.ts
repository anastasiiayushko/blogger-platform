import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

enum BlogSortByEnum {
  createAt = 'createdAt',
  description = 'description',
  websiteUrl = 'websiteUrl',
  isMembership = 'isMembership',
  name = 'name',
}

export class GetBlogsQueryParamsInputDto extends BaseQueryParams {
  // @ValidateIf((val) => val !== undefined)
  @IsOptional()
  @IsString()
  @Type(() => String)
  searchNameTerm: string | null = null;

  @IsEnum(BlogSortByEnum)
  @IsOptional()
  @Type(() => String)
  sortBy: BlogSortByEnum = BlogSortByEnum.createAt;
}
