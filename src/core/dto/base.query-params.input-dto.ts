import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { QuestionPublishStatusEnum } from '../../modules/quiz/sa-question/api/input-dto/question-query-params.input-dto';

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

//базовый класс для query параметров с пагинацией
//значения по-умолчанию применятся автоматически при настройке глобального ValidationPipe в main.ts
export class BaseQueryParams {
  @ApiProperty({
    type: Number,
    description: 'pageNumber is number of portions that should be returned',
    default: 1,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageNumber: number = 1;

  @ApiProperty({
    type: Number,
    description: 'pageSize is portions size that should be returned',
    default: 10,
    required: false,
  })
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize: number = 10;

  @ApiProperty({
    enum: SortDirection,
    default: SortDirection.Desc,
    required: false,
  })
  @IsEnum(SortDirection)
  @IsOptional()
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
