import { BaseQueryParams } from '../../../../core/dto/base.query-params.input-dto';
import { UsersSortBy } from './users-sort-by';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Trim } from '../../../../core/decorators/transform/trim';

export class GetUsersQueryParams extends BaseQueryParams {
  @IsEnum(UsersSortBy)
  @IsOptional()
  sortBy = UsersSortBy.CreatedAt;

  @Transform(({ value }) => (value as unknown) ?? null)
  @ValidateIf((_, value) => value !== null)
  // @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  searchLoginTerm: string | null = null;

  // @Transform(({ value }) => (value as unknown) ?? null)
  // @ValidateIf((_, value) => value !== null)
  @IsOptional()
  @Trim()
  @IsString()
  @IsNotEmpty()
  searchEmailTerm: string | null = null;
}
