import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { UsersSortBy } from './users-sort-by';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Trim } from '../../../../core/decorators/transform/trim';

export class GetUsersQueryParams extends BaseQueryParams {
  @IsEnum(UsersSortBy)
  @IsOptional()
  @Type(() => String) // если используешь class-transformer
  sortBy = UsersSortBy.CreatedAt;

  @Transform(({ value }) => (value as unknown) ?? null)
  @ValidateIf((_, value) => value !== null)
  @Trim()
  @IsString()
  searchLoginTerm: string | null = null;

  @Transform(({ value }) => (value as unknown) ?? null)
  @ValidateIf((_, value) => value !== null)
  @Trim()
  @IsString()
  searchEmailTerm: string | null = null;
}
