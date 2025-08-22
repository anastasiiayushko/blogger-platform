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
import { UsersQuerySqlRepository } from '../infrastructure/sql/query/users.query-sql-repository';
import { CommandBus } from '@nestjs/cqrs';
import { SaCreateUserCommand } from '../application/sa-users-usecases/sa-create-user.usecase';
import { UuidValidationPipe } from '../../../core/pipes/uuid-validation-transform-pipe';
import { SaDeleteUserCommand } from '../application/sa-users-usecases/sa-delete-user.usecase';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';

@Injectable()
@Controller('/sa/users')
@UseGuards(BasicAuthGuard)
export class SaUsersController {
  constructor(
    protected userQwSqlRepository: UsersQuerySqlRepository,
    protected commandBus: CommandBus,
  ) {}

  @Get('')
  getAll(@Query() query: GetUsersQueryParams) {
    return this.userQwSqlRepository.getAll(query);
  }

  @Post()
  async create(@Body() userDto: CreateUsersInputDto) {
    const userId: string = (await this.commandBus.execute<SaCreateUserCommand>(
      new SaCreateUserCommand({
        login: userDto.login,
        email: userDto.email,
        password: userDto.password,
      }),
    )) as string;
    return this.userQwSqlRepository.findOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', UuidValidationPipe) id: string): Promise<void> {
    await this.userQwSqlRepository.findOrNotFoundFail(id);
    await this.commandBus.execute<SaDeleteUserCommand>(
      new SaDeleteUserCommand(id),
    );
    return;
  }
}
