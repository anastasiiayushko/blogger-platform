import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Injectable,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { CreateUsersInputDto } from './input-dto/create-users.input-dto';
import { CommandBus } from '@nestjs/cqrs';
import { SaCreateUserCommand } from '../application/sa-users-usecases/sa-create-user.usecase';
import { UuidValidationPipe } from '../../../core/pipes/uuid-validation-transform-pipe';
import { SaDeleteUserCommand } from '../application/sa-users-usecases/sa-delete-user.usecase';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { SkipThrottle } from '@nestjs/throttler';
import { UserQueryRepository } from '../infrastructure/query/user-query-repositroy';
import { PaginatedViewDto } from '../../../core/dto/base.paginated.view-dto';
import { UserViewModel } from '../infrastructure/view-model/user-view-model';

@Injectable()
@Controller('/sa/users')
@UseGuards(BasicAuthGuard)
@SkipThrottle()
export class SaUsersController {
  constructor(
    protected userQueryRepository: UserQueryRepository,
    protected commandBus: CommandBus,
  ) {}

  @Get('')
  getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewModel[]>> {
    return this.userQueryRepository.getAll(query);
  }

  @Post()
  async create(@Body() userDto: CreateUsersInputDto): Promise<UserViewModel> {
    const userId: string = (await this.commandBus.execute<SaCreateUserCommand>(
      new SaCreateUserCommand({
        login: userDto.login,
        email: userDto.email,
        password: userDto.password,
      }),
    )) as string;
    return this.userQueryRepository.findOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', UuidValidationPipe) id: string): Promise<void> {
    await this.userQueryRepository.findOrNotFoundFail(id);
    await this.commandBus.execute<SaDeleteUserCommand>(
      new SaDeleteUserCommand(id),
    );
    return;
  }
}
