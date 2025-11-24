import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, Query, UseGuards } from '@nestjs/common';
import { PostViewDTO } from './view-dto/post.view-dto';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { SkipThrottle } from '@nestjs/throttler';
import { UuidValidationPipe } from '../../../../core/pipes/uuid-validation-transform-pipe';
import { UserContextDto } from '../../../user-accounts/decorators/param/user-context.dto';
import { BearerOptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-optional-jwt-auth.guard';
import { OptionalCurrentUserFormRequest } from '../../../user-accounts/decorators/param/options-current-user-from-request.decorator';
import { PostQueryRepository } from '../infrastructure/query-repository/post.query-repository';
import { BearerJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-jwt-auth.guard';
import { CommentInputDto } from '../../comments/api/input-dto/comment.input-dto';
import { CurrentUserFormRequest } from '../../../user-accounts/decorators/param/current-user-form-request.decorator';
import { CommentViewDTO } from '../../comments/api/view-dto/comment.view-dto';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecases';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import {
  GetCommentsByPostWithPagingQuery
} from '../../comments/application/queries-usecases/get-comments-by-post-with-paging.query';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { LikeStatusInputDto } from '../../../../core/dto/list-status-input-dto';
import { LikeStatusPostCommand } from '../application/usecases/like-status-post.usecase';

@Controller('posts')
@SkipThrottle()
export class PostController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
    protected commentsQueryRepository: CommentsQueryRepository,
    protected postQueryRepository: PostQueryRepository,
  ) {}

  @Get()
  @UseGuards(BearerOptionalJwtAuthGuard)
  async getAll(
    @Query() query: GetPostQueryParams,
    @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    return await this.postQueryRepository.getAll(query, null, user?.id ?? null);
  }

  @Get(':id')
  @UseGuards(BearerOptionalJwtAuthGuard)
  async getById(
    @Param('id', UuidValidationPipe) id: string,
    @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<PostViewDTO> {
    return this.postQueryRepository.getByIdOrNotFoundFail(id, user?.id ?? null);
  }

  @Put(':postId/like-status')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(
    @Param('postId', UuidValidationPipe) postId: string,
    @Body() inputDto: LikeStatusInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    return this.commandBus.execute<LikeStatusPostCommand>(
      new LikeStatusPostCommand(postId, user.id, inputDto.likeStatus),
    );
  }

  @Get(':postId/comments')
  @UseGuards(BearerOptionalJwtAuthGuard)
  async getAllComment(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
    @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    return await this.queryBus.execute<GetCommentsByPostWithPagingQuery>(
      new GetCommentsByPostWithPagingQuery(postId, query, user?.id),
    );
  }



  @Post(':postId/comments')
  @UseGuards(BearerJwtAuthGuard)
  async createComment(
    @Param('postId', UuidValidationPipe) postId: string,
    @Body() inputDto: CommentInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ): Promise<CommentViewDTO> {
    //::TODO можем ли в команду вынести селект поста что бы не дублировать код в двух местах
    const commentId = await this.commandBus.execute<CreateCommentCommand>(
      new CreateCommentCommand(postId, user.id, inputDto.content),
    );

    return this.commentsQueryRepository.getByIdOrNotFoundFail(
      commentId,
      user.id,
    );
  }
}
