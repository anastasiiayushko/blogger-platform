import { SortDirection } from '../../dto/base.query-params.input-dto';

export type OrderDir = 'ASC' | 'DESC';

export const toTypeOrmOrderDir = (d?: SortDirection): OrderDir =>
  d === SortDirection.Asc ? 'ASC' : 'DESC';