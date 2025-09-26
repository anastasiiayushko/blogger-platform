import { Injectable } from '@nestjs/common';
import { ValidateDomainDto } from '../../../core/decorators/validate-domain-dto/ValidateDomainDto';
import { CreateUserService } from './create-user-service';
import { CreateUsersInputDto } from '../api/input-dto/create-users.input-dto';
import { UsersSqlRepository } from '../infrastructure/sql/users.sql-repository';

@Injectable()
export class UserService {
  constructor(
    private createUserService: CreateUserService,
    private userRepository: UsersSqlRepository,
  ) {}

  @ValidateDomainDto(CreateUsersInputDto)
  async createUser(userInputDTO: CreateUsersInputDto): Promise<string> {
    return await this.createUserService.addNewUserSa(userInputDTO);
  }

  async deleteUser(userId: string) {
    await this.userRepository.findOrNotFoundFail(userId);
    return await this.userRepository.delete(userId);
  }
}
