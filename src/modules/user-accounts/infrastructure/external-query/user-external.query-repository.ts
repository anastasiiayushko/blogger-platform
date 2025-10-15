import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../../domin/user.entity';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { UserViewDto } from '../mapper/user-view-dto';

@Injectable()
export class UserExternalQueryRepository {
  constructor(
    @InjectRepository(User) protected userRepository: Repository<User>,
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
   * Find a user by ID. If the user is not found, return null.
   * @param {string} id - The ID of the user to find.
   * @returns {UserViewDto | null} - The user representation in DTO format.
   */
  async findById(id: string): Promise<UserViewDto | null> {
    const user = await this.userRepository.findOneBy({ id: id });
    if (!user) {
      return null;
    }
    return UserViewDto.mapToView(user);
  }
}
