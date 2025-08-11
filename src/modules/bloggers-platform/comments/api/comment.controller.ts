import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-transform-pipe';
import { BearerJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-jwt-auth.guard';
import { CommentInputDto } from './input-dto/comment.input-dto';
import { CurrentUserFormRequest } from '../../../user-accounts/decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../../../user-accounts/decorators/param/user-context.dto';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecases';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecases';
import { BearerOptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-optional-jwt-auth.guard';
import { LikeStatusCommentCommand } from '../application/usecases/like-status-comment.usecase';
import { LikeStatusInputDto } from '../../likes/api/input-dto/like-status.input-dto';
import { OptionalCurrentUserFormRequest } from '../../../user-accounts/decorators/param/options-current-user-from-request.decorator';
import { GetCommentByIdQuery } from '../application/queries-usecases/get-comment-by-id.query';

@Controller('comments')
export class CommentController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
  ) {}

  @Get(':id')
  @UseGuards(BearerOptionalJwtAuthGuard)
  async getById(
    @Param('id', ObjectIdValidationPipe) id: string,
    @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ) {
    console.log(user);
    return this.queryBus.execute<GetCommentByIdQuery>(
      new GetCommentByIdQuery(id, user?.id),
    );
  }

  @Put(':commentId/like-status')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(
    @Param('commentId', ObjectIdValidationPipe) commentId: string,
    @Body() inputDto: LikeStatusInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {

    return await this.commandBus.execute<LikeStatusCommentCommand>(
      new LikeStatusCommentCommand(commentId, user.id, inputDto.likeStatus),
    );
  }

  @Put(':commentId')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Param('commentId', ObjectIdValidationPipe) commentId: string,
    @Body() inputDto: CommentInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    return await this.commandBus.execute<UpdateCommentCommand>(
      new UpdateCommentCommand(commentId, user.id, inputDto.content),
    );
  }

  @Delete(':commentId')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId', ObjectIdValidationPipe) commentId: string,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    return await this.commandBus.execute<DeleteCommentCommand>(
      new DeleteCommentCommand(commentId, user.id),
    );
  }
}
