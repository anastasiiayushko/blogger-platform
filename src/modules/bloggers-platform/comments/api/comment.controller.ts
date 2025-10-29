import { Controller } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SkipThrottle } from '@nestjs/throttler';

@Controller('comments')
@SkipThrottle()
export class CommentController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
  ) {}

  // @Get(':id')
  // @UseGuards(BearerOptionalJwtAuthGuard)
  // async getById(
  //   @Param('id', UuidValidationPipe) id: string,
  //   @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  // ): Promise<CommentViewDTO> {
  //   return this.commentsQueryRepository.getByIdOrNotFoundFail(
  //     id,
  //     user?.id ?? null,
  //   );
  // }

  // @Put(':commentId/like-status')
  // @UseGuards(BearerJwtAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async likeStatus(
  //   @Param('commentId', UuidValidationPipe) commentId: string,
  //   @Body() inputDto: LikeStatusInputDto,
  //   @CurrentUserFormRequest() user: UserContextDto,
  // ) {
  //   return this.commandBus.execute<LikeStatusCommentCommand>(
  //     new LikeStatusCommentCommand(commentId, user.id, inputDto.likeStatus),
  //   );
  // }

  // @Put(':commentId')
  // @UseGuards(BearerJwtAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async updateComment(
  //   @Param('commentId', UuidValidationPipe) commentId: string,
  //   @Body() inputDto: CommentInputDto,
  //   @CurrentUserFormRequest() user: UserContextDto,
  // ) {
  //   return this.commandBus.execute<UpdateCommentCommand>(
  //     new UpdateCommentCommand(commentId, user.id, inputDto.content),
  //   );
  // }

  // @Delete(':commentId')
  // @UseGuards(BearerJwtAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async deleteComment(
  //   @Param('commentId', UuidValidationPipe) commentId: string,
  //   @CurrentUserFormRequest() user: UserContextDto,
  // ) {
  //   return this.commandBus.execute<DeleteCommentCommand>(
  //     new DeleteCommentCommand(commentId, user.id),
  //   );
  // }
}
