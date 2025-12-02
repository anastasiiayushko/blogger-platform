import { BaseQueryParams } from '../../../../../core/dto/base.query-params.input-dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum QuestionSortByEnum {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
}

export enum QuestionPublishStatusEnum {
  all = 'all',
  published = 'published',
  notPublished = 'notPublished',
}

export class QuestionQueryParams extends BaseQueryParams {
  @ApiProperty({
    type: 'string',
    description: 'bodySearchTerm',
    required: false,
  })
  @IsOptional()
  @IsString()
  bodySearchTerm: string | null = null;

  @ApiProperty({
    type: 'string',
    enum: QuestionPublishStatusEnum,
    required: false,
    default: QuestionPublishStatusEnum.all,
  })
  @IsEnum(QuestionPublishStatusEnum)
  @IsOptional()
  publishedStatus: QuestionPublishStatusEnum = QuestionPublishStatusEnum.all;

  @ApiProperty({
    type: 'string',
    enum: QuestionSortByEnum,
    default: QuestionSortByEnum.createdAt,
    required: false,
  })
  @IsEnum(QuestionSortByEnum)
  @IsOptional()
  sortBy: QuestionSortByEnum = QuestionSortByEnum.createdAt;

}
