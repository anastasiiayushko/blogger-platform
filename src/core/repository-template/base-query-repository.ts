import { PaginatedViewDto } from '../dto/base.paginated.view-dto';

export abstract class BaseQueryRepository<T, Q> {
  abstract findById(id: string): Promise<T | null>;

  abstract findOrNotFoundFail(id: string): Promise<T>;

  abstract getAll(query: Q): Promise<PaginatedViewDto<T[]>>;
}
