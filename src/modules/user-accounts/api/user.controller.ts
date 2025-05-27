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
import { UserInputDTO } from './input-dto/users.input-dto';
import { GetUsersQueryParams } from './input-dto/get-users-query-params.input-dto';
import { UserQueryRepository } from '../infrastructure/query/users.query-repository';
import { ObjectIdValidationPipe } from '../../../core/pipes/object-id-validation-transform-pipe';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';

@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userQueryRepository: UserQueryRepository,
  ) {}

  @UseGuards(BasicAuthGuard)
  @Get()
  async getAll(@Query() query: GetUsersQueryParams) {
    return this.userQueryRepository.getAll(query);
  }

  @UseGuards(BasicAuthGuard)
  @Post()
  async create(@Body() userInputDTO: UserInputDTO) {
    const userId = await this.userService.createUser(userInputDTO, true);
    return this.userQueryRepository.findOrNotFoundFail(userId);
  }

  @UseGuards(BasicAuthGuard)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ObjectIdValidationPipe) userId: string) {
    return await this.userService.deleteUser(userId);
  }
}
