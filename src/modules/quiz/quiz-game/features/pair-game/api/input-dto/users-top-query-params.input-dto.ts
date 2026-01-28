import { IsArray, IsEnum, IsOptional, ValidateNested } from 'class-validator';
import { plainToInstance, Transform, Type } from 'class-transformer';
import { BaseQueryParams } from '../../../../../../../core/dto/base.query-params.input-dto';
import { ApiProperty, OmitType } from '@nestjs/swagger';

const parseSortItems = (value): SortItemDto[] => {
  if (value == null) {
    return [];
  }
  const inputData = Array.isArray(value) ? value : [value];

  return inputData
    .filter((item) => typeof item === 'string' && item.trim() !== '')
    .map((item) => {
      const [field = '', direction = ''] = item.trim().split(' ');
      return {
        field: field,
        direction: direction.toUpperCase(),
      };
    });
};

export enum UsersTopSortByEnum {
  avgScore = 'avgScore',
  sumScore = 'sumScore',
  gameCount = 'gameCount',
  winsCount = 'winsCount',
  lossesCount = 'lossesCount',
  drawsCount = 'drawsCount',
}

enum SortDirection {
  asc = 'ASC',
  desc = 'DESC',
}

class SortItemDto {
  @IsEnum(UsersTopSortByEnum)
  field: UsersTopSortByEnum;

  @IsEnum(SortDirection)
  direction: SortDirection;
}

export class UsersTopQueryParamsDto extends OmitType(BaseQueryParams, [
  'sortDirection',
] as const) {
  @ApiProperty({
    type: 'array',
    description: 'Sort fields with direction, e.g. "avgScore asc".',
    required: false,
  })
  @IsOptional()
  @Transform(
    ({ value }) => plainToInstance(SortItemDto, parseSortItems(value)),
    { toClassOnly: true },
  )
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SortItemDto)
  sort: SortItemDto[] = [];
}
