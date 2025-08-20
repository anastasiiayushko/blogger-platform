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
  UseGuards,
} from '@nestjs/common';
import { BasicAuthGuard } from '../guards/basic/basic-auth.guard';
import { UsersSqlRepository } from '../infrastructure/sql/users.sql-repository';
import { CreateUsersInputDto } from './input-dto/create-users.input-dto';

@Injectable()
@Controller('/sa/users')
@UseGuards(BasicAuthGuard)
export class SaUsersController {
  constructor(protected userSqlRepository: UsersSqlRepository) {}

  @Get(':login')
  getAll(@Param('login') login: string) {
    return this.userSqlRepository.findByEmailOrLogin(login);
  }

  @Post()
  async create(@Body() userInputDTO: CreateUsersInputDto) {
    return this.userSqlRepository.create(
      userInputDTO.login,
      userInputDTO.email,
      userInputDTO.password,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') userId: string) {
    return await this.userSqlRepository.delete(userId);
  }
}
