import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

export enum SortDirection {
  Asc = 'ASC',
  Desc = 'DESC',
}

//базовый класс для query параметров с пагинацией
//значения по-умолчанию применятся автоматически при настройке глобального ValidationPipe в main.ts
export class BaseQueryParams {
  //для трансформации в number
  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageNumber: number = 1;

  @IsInt()
  @Min(1)
  @IsOptional()
  @Type(() => Number)
  pageSize: number = 10;

  @IsEnum(SortDirection)
  @IsOptional()
  // @Type(() => String) // если используешь class-transformer
  sortDirection: SortDirection = SortDirection.Desc;

  calculateSkip() {
    return (this.pageNumber - 1) * this.pageSize;
  }
}
