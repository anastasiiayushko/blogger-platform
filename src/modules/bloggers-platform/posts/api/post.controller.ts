import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostViewDTO } from './view-dto/post.view-dto';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetPostByIdQuery } from '../application/query-usecases/get-post-by-id.query-handler';
import { GetPostsWithPagingQuery } from '../application/query-usecases/get-posts-with-paging.query-handler';
import { SkipThrottle } from '@nestjs/throttler';
import { UuidValidationPipe } from '../../../../core/pipes/uuid-validation-transform-pipe';
import { BearerJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-jwt-auth.guard';
import { CommentInputDto } from '../../comments/api/input-dto/comment.input-dto';
import { UserContextDto } from '../../../user-accounts/decorators/param/user-context.dto';
import { CurrentUserFormRequest } from '../../../user-accounts/decorators/param/current-user-form-request.decorator';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecases';
import { CommentsQueryRepository } from '../../comments/infrastructure/query/comments.query-repository';
import { CommentViewDTO } from '../../comments/infrastructure/mapper/comment.view-dto';

@Controller('posts')
@SkipThrottle()
export class PostController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
    protected commentsQueryRepository: CommentsQueryRepository,
  ) {}

  @Get()
  // @UseGuards(BearerOptionalJwtAuthGuard)
  async getAll(
    @Query() query: GetPostQueryParams,
    // @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    return this.queryBus.execute<GetPostsWithPagingQuery>(
      new GetPostsWithPagingQuery(null, query, null),
    );
  }

  @Get(':id')
  // @UseGuards(BearerOptionalJwtAuthGuard)
  async getById(
    @Param('id', UuidValidationPipe) id: string,
    // @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<PostViewDTO> {
    return this.queryBus.execute(new GetPostByIdQuery(id, null));
  }

  // @Put(':postId/like-status')
  // @UseGuards(BearerJwtAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async likeStatus(
  //   @Param('postId', ObjectIdValidationPipe) postId: string,
  //   @Body() inputDto: LikeStatusInputDto,
  //   @CurrentUserFormRequest() user: UserContextDto,
  // ) {
  //   return this.commandBus.execute<SetLikeStatusPostCommand>(
  //     new SetLikeStatusPostCommand(postId, user.id, inputDto.likeStatus),
  //   );
  // }
  //
  // @Post()
  // @UseGuards(BasicAuthGuard)
  // async create(@Body() postInput: PostInputDTO): Promise<PostViewDTO> {
  //   const postId = await this.commandBus.execute<CreatePostCommand>(
  //     new CreatePostCommand(
  //       postInput.blogId,
  //       postInput.content,
  //       postInput.shortDescription,
  //       postInput.title,
  //     ),
  //   );
  //   return this.queryBus.execute<GetPostByIdQuery>(
  //     new GetPostByIdQuery(postId, null),
  //   );
  // }
  //
  // @Put(':id')
  // @UseGuards(BasicAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async update(@Param('id') id: string, @Body() postInput: PostInputDTO) {
  //   return this.commandBus.execute<UpdatePostCommand>(
  //     new UpdatePostCommand(id, postInput),
  //   );
  // }
  //
  // @Delete(':id')
  // @UseGuards(BasicAuthGuard)
  // @HttpCode(HttpStatus.NO_CONTENT)
  // async delete(@Param('id', ObjectIdValidationPipe) id: string) {
  //   await this.commandBus.execute<DeletePostCommand>(new DeletePostCommand(id));
  // }
  //
  // @Get(':postId/comments')
  // @UseGuards(BearerOptionalJwtAuthGuard)
  // async getAllComment(
  //   @Param('postId') postId: string,
  //   @Query() query: GetCommentsQueryParams,
  //   @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  // ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
  //   return await this.queryBus.execute<GetCommentsByPostWithPagingQuery>(
  //     new GetCommentsByPostWithPagingQuery(postId, query, user?.id),
  //   );
  // }
  //
  @Post(':postId/comments')
  @UseGuards(BearerJwtAuthGuard)
  async createComment(
    @Param('postId', UuidValidationPipe) postId: string,
    @Body() inputDto: CommentInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ): Promise<CommentViewDTO> {
    const commentId = await this.commandBus.execute<CreateCommentCommand>(
      new CreateCommentCommand(postId, user.id, inputDto.content),
    );
    return this.commentsQueryRepository.getByIdOrNotFoundFail(
      commentId,
      user.id,
    );
  }
}
