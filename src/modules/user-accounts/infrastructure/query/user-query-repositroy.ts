import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { User } from '../../domin/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from '../mapper/user-view-dto';
import { UserMeViewDto } from '../mapper/user-me-view-dto';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserViewDto} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.userRepository.findOneBy({ id: id });

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User_root not found',
        extensions: [],
      });
    }
    return UserViewDto.mapToView(user);
  }

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserMeViewDto} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */

  async getUserMeById(id: string): Promise<UserMeViewDto> {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User_root not found',
        extensions: [],
      });
    }
    return UserMeViewDto.mapToView(user);
  }

  async getAll(
    query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    // 1) Белый список сорти column -> SQL-выражение
    // const SORT_MAP: Record<string, string> = {
    //   login: 'u.login',
    //   email: 'u.email',
    //   createdAt: 'u.created_at',
    // };
    //
    // const sortCol = SORT_MAP[query.sortBy] ?? 'u.created_at';
    // const sortDir: 'ASC' | 'DESC' =
    //   String(query.sortDirection).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    //
    // const baseQB = this.userRepository
    //   .createQueryBuilder('u')
    //   .select([
    //     'u.id as id',
    //     'u.email as email',
    //     'u.login as login',
    //     'u.created_at as "createdAt"',
    //   ]);
    //
    // if (query.searchLoginTerm) {
    //   baseQB.where('u.login ILIKE :login', {
    //     login: `%${query.searchLoginTerm}%`,
    //   });
    // }
    //
    // if (query.searchEmailTerm) {
    //   const condition = 'u.email ILIKE :email';
    //   const params = { email: `%${query.searchEmailTerm}%` };
    //
    //   query?.searchLoginTerm
    //     ? baseQB.orWhere(condition, params)
    //     : baseQB.where(condition, params);
    // }
    //
    // // 4) Счётчик — на клон билдерa, чтобы исключить сайд-эффекты
    // const totalCount = await baseQB.clone().getCount();
    //
    // // 5) Пагинированные строки
    // const items = await baseQB
    //   .orderBy(sortCol, sortDir)
    //   .skip(query.calculateSkip()) // OFFSET
    //   .take(query.pageSize) // LIMIT
    //   .getRawMany<UserViewModel>(); // маппится по alias’ам из select’а

    const whereOperator: any[] = [];
    if (query.searchLoginTerm) {
      whereOperator.push({ login: ILike(`%${query.searchLoginTerm}%`) });
    }
    if (query.searchEmailTerm) {
      whereOperator.push({ email: ILike(`%${query.searchEmailTerm}%`) });
    }

    const users = await this.userRepository.find({
      where: whereOperator,
      order: {
        [`${query.sortBy}`]: query.sortDirection,
      },
      skip: query.calculateSkip(),
      take: query.pageSize,
    });

    const totalCount = await this.userRepository.count({
      where: whereOperator,
    });

    return PaginatedViewDto.mapToView({
      items: users.map((u) => UserViewDto.mapToView(u)),
      totalCount: totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
