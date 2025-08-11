import { InjectModel } from '@nestjs/mongoose';
import { User, UserModelType } from '../../domin/user.entity';
import { Injectable } from '@nestjs/common';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UserViewDto } from '../../api/view-dto/users.view-dto';
import { GetUsersQueryParams } from '../../api/input-dto/get-users-query-params.input-dto';
import { FilterQuery } from 'mongoose';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserMeViewDto } from '../../api/view-dto/user-me.view-dto';

@Injectable()
export class UsersExternalQueryRepository {
  constructor(
    @InjectModel(User.name)
    private UserModel: UserModelType,
  ) {}

  /**
   * Find a user by ID. If the user is not found, throws NotFoundException.
   * @param {string} id - The ID of the user to find.
   * @returns {UserViewDto} - The user representation in DTO format.
   * @throws {NotFoundException} - If no user is found with the given ID.
   */
  async findOrNotFoundFail(id: string): Promise<UserViewDto> {
    const user = await this.UserModel.findById(id);
    if (!user) {
      //TODO: Replace with a domain-specific exception if needed
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'User not found',
        extensions: [],
      });
    }
    return UserViewDto.mapToView(user);
  }




}
