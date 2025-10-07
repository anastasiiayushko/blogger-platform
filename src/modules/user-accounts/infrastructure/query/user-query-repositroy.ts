import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../domin/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserMeViewModel } from '../view-model/user-me-view-model';
import { UserViewModel } from '../view-model/user-view-model';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserViewModel} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<UserViewModel> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id as id',
        'u.email as email',
        'u.login as login',
        'u.created_at as "createdAt"',
      ])
      .where('u.id = :id', { id })
      .getRawOne<UserViewModel>();
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User_root not found',
        extensions: [],
      });
    }
    return user;
  }

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserMeViewModel} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */

  async getUserMeById(id: string): Promise<UserMeViewModel> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .select(['u.id as "userId"', 'u.email as email', 'u.login as login'])
      .where('u.id = :id', { id })
      .getRawOne<UserMeViewModel>();
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User_root not found',
        extensions: [],
      });
    }
    return user;
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewModel[]>> {
    // 1) Белый список сорти column -> SQL-выражение
    const SORT_MAP: Record<string, string> = {
      login: 'u.login COLLATE "C"',
      email: 'u.email COLLATE "C"',
      createdAt: 'u.created_at',
    };

    const sortCol = SORT_MAP[query.sortBy] ?? 'u.created_at';
    const sortDir: 'ASC' | 'DESC' =
      String(query.sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const baseQB = this.userRepository
      .createQueryBuilder('u')
      .select([
        'u.id as id',
        'u.email as email',
        'u.login as login',
        'u.created_at as "createdAt"',
      ]);

    if (query.searchLoginTerm) {
      baseQB.where('u.login ILIKE :login', {
        login: `%${query.searchLoginTerm}%`,
      });
    }

    if (query.searchEmailTerm) {
      const condition = 'u.email ILIKE :email';
      const params = { email: `%${query.searchEmailTerm}%` };

      query?.searchLoginTerm
        ? baseQB.orWhere(condition, params)
        : baseQB.where(condition, params);
    }

    // 4) Счётчик — на клон билдерa, чтобы исключить сайд-эффекты
    const totalCount = await baseQB.clone().getCount();

    // 5) Пагинированные строки
    const items = await baseQB
      .orderBy(sortCol, sortDir)
      .skip(query.calculateSkip()) // OFFSET
      .take(query.pageSize) // LIMIT
      .getRawMany<UserViewModel>(); // маппится по alias’ам из select’а

    return PaginatedViewDto.mapToView({
      items: items,
      totalCount: totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
