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
import { BearerJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-jwt-auth.guard';
import { CommentInputDto } from './input-dto/comment.input-dto';
import { CurrentUserFormRequest } from '../../../user-accounts/decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../../../user-accounts/decorators/param/user-context.dto';
import { UpdateCommentCommand } from '../application/usecases/update-comment.usecases';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DeleteCommentCommand } from '../application/usecases/delete-comment.usecases';
import { BearerOptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-optional-jwt-auth.guard';
import { LikeStatusCommentCommand } from '../application/usecases/like-status-comment.usecase';
import { OptionalCurrentUserFormRequest } from '../../../user-accounts/decorators/param/options-current-user-from-request.decorator';
import { SkipThrottle } from '@nestjs/throttler';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { CommentViewDTO } from '../infrastructure/mapper/comment.view-dto';
import { UuidValidationPipe } from '../../../../core/pipes/uuid-validation-transform-pipe';
import { LikeStatusInputDto } from '../../../../core/dto/list-status-input-dto';

@Controller('comments')
@SkipThrottle()
export class CommentController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
    protected commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get(':id')
  @UseGuards(BearerOptionalJwtAuthGuard)
  async getById(
    @Param('id', UuidValidationPipe) id: string,
    @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<CommentViewDTO> {
    return this.commentsQueryRepository.getByIdOrNotFoundFail(
      id,
      user?.id ?? null,
    );
  }

  @Put(':commentId/like-status')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(
    @Param('commentId', UuidValidationPipe) commentId: string,
    @Body() inputDto: LikeStatusInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    return this.commandBus.execute<LikeStatusCommentCommand>(
      new LikeStatusCommentCommand(commentId, user.id, inputDto.likeStatus),
    );
  }

  @Put(':commentId')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateComment(
    @Param('commentId', UuidValidationPipe) commentId: string,
    @Body() inputDto: CommentInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    return this.commandBus.execute<UpdateCommentCommand>(
      new UpdateCommentCommand(commentId, user.id, inputDto.content),
    );
  }

  @Delete(':commentId')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteComment(
    @Param('commentId', UuidValidationPipe) commentId: string,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    return this.commandBus.execute<DeleteCommentCommand>(
      new DeleteCommentCommand(commentId, user.id),
    );
  }
}
