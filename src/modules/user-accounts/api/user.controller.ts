import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../application/user.service';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { UserQueryRepository } from '../infrastructure/query/users.query-repository';
import { ObjectIdValidationPipe } from '../../../core/pipes/object-id-validation-transform-pipe';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { CreateUsersInputDto } from './input-dto/create-users.input-dto';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('users')
@UseGuards(BasicAuthGuard)
@SkipThrottle()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userQueryRepository: UserQueryRepository,
  ) {}

  @Get()
  async getAll(@Query() query: GetUsersQueryParams) {
    return this.userQueryRepository.getAll(query);
  }

  @Post()
  async create(@Body() userInputDTO: CreateUsersInputDto) {
    const userId = await this.userService.createUser(userInputDTO);
    return this.userQueryRepository.findOrNotFoundFail(userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ObjectIdValidationPipe) userId: string) {
    return await this.userService.deleteUser(userId);
  }
}
