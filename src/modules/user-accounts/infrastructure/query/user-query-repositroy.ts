import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { User } from '../../domin/user.entity';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from '../mapper/user-view-dto';
import { UserMeViewDto } from '../mapper/user-me-view-dto';
import { SortDirection } from '../../../../core/dto/base.query-params.input-dto';

@Injectable()
export class UserQueryRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly dataSource: DataSource,
  ) {}

  private async findById(id: string): Promise<User | null> {
    const user = await this.userRepository
      .createQueryBuilder('u')
      .where('u.id = :id', { id })
      .printSql()
      .getOne();
    if (!user) {
      return null;
    }
    return user;
  }

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserViewDto} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.findById(id);
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
    const user = await this.findById(id);
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
    const conditions: string[] = [];
    const params: any[] = [];

    const userSelectQueryBuilder = this.userRepository.createQueryBuilder('u');

    if (query.searchLoginTerm) {
      userSelectQueryBuilder.where('u.login ILIKE :login', {
        login: `%${query.searchLoginTerm}%`,
      });
    }

    if (query.searchEmailTerm) {
      const condition = 'u.email ILIKE :email';
      const params = { email: `%${query.searchEmailTerm}%` };

      if (query.searchLoginTerm) {
        userSelectQueryBuilder.orWhere(condition, params);
      } else {
        userSelectQueryBuilder.where(condition, params);
      }
    }

    const sortDirection = query.sortDirection;

    const totalCount = await userSelectQueryBuilder.getCount();
    const items = await userSelectQueryBuilder
      .orderBy(
        `u.${query.sortBy}`,
        `${sortDirection}` as unknown as 'ASC' | 'DESC',
      )
      .skip(query.calculateSkip()) // = OFFSET
      .take(query.pageSize) // = LIMIT
      .getMany();

    return PaginatedViewDto.mapToView({
      items: items.map(UserViewDto.mapToView),
      totalCount: totalCount,
      page: query.pageNumber,
      size: query.pageSize,
    });
  }
}
