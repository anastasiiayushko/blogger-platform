import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PostInputDTO } from './input-dto/post.input-dto';
import { PostViewDTO } from './view-dto/post.view-dto';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentViewDTO } from '../../comments/api/view-dto/comment.view-dto';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-transform-pipe';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecases';
import { UpdatePostCommand } from '../application/usecases/update-post.usecases';
import { DeletePostCommand } from '../application/usecases/delete-post.usecases';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { BearerJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-jwt-auth.guard';
import { CurrentUserFormRequest } from '../../../user-accounts/decorators/param/current-user-form-request.decorator';
import { UserContextDto } from '../../../user-accounts/decorators/param/user-context.dto';
import { CreateCommentCommand } from '../../comments/application/usecases/create-comment.usecases';
import { CommentInputDto } from '../../comments/api/input-dto/comment.input-dto';
import { GetCommentByIdQuery } from '../../comments/application/queries-usecases/get-comment-by-id.query';
import { GetCommentsByPostWithPagingQuery } from '../../comments/application/queries-usecases/get-comments-by-post-with-paging.query';
import { BearerOptionalJwtAuthGuard } from '../../../user-accounts/guards/bearer/bearer-optional-jwt-auth.guard';
import { OptionalCurrentUserFormRequest } from '../../../user-accounts/decorators/param/options-current-user-from-request.decorator';
import { GetPostByIdQuery } from '../application/query-usecases/get-post-by-id.query-handler';
import { GetPostsWithPagingQuery } from '../application/query-usecases/get-posts-with-paging.query-handler';
import { LikeStatusInputDto } from '../../likes/api/input-dto/like-status.input-dto';
import { SetLikeStatusPostCommand } from '../application/usecases/set-like-status-post.usecase';

@Controller('posts')
export class PostController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
  ) {}

  @Get()
  @UseGuards(BearerOptionalJwtAuthGuard)
  async getAll(
    @Query() query: GetPostQueryParams,
    @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    return this.queryBus.execute<GetPostsWithPagingQuery>(
      new GetPostsWithPagingQuery(user?.id ?? null, query, null),
    );
  }

  @Get(':id')
  @UseGuards(BearerOptionalJwtAuthGuard)
  async getById(
    @Param('id', ObjectIdValidationPipe) id: string,
    @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  ): Promise<PostViewDTO> {
    return this.queryBus.execute(new GetPostByIdQuery(id, user?.id ?? null));
  }

  @Put(':postId/like-status')
  @UseGuards(BearerJwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async likeStatus(
    @Param('postId', ObjectIdValidationPipe) postId: string,
    @Body() inputDto: LikeStatusInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    return this.commandBus.execute<SetLikeStatusPostCommand>(
      new SetLikeStatusPostCommand(postId, user.id, inputDto.likeStatus),
    );
  }

  @Post()
  @UseGuards(BasicAuthGuard)
  async create(@Body() postInput: PostInputDTO): Promise<PostViewDTO> {
    const postId = await this.commandBus.execute<CreatePostCommand>(
      new CreatePostCommand(
        postInput.blogId,
        postInput.content,
        postInput.shortDescription,
        postInput.title,
      ),
    );
    return this.queryBus.execute<GetPostByIdQuery>(
      new GetPostByIdQuery(postId, null),
    );
  }

  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() postInput: PostInputDTO) {
    return this.commandBus.execute<UpdatePostCommand>(
      new UpdatePostCommand(id, postInput),
    );
  }

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ObjectIdValidationPipe) id: string) {
    await this.commandBus.execute<DeletePostCommand>(new DeletePostCommand(id));
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
    @Param('postId', ObjectIdValidationPipe) postId: string,
    @Body() inputDto: CommentInputDto,
    @CurrentUserFormRequest() user: UserContextDto,
  ) {
    const commentId = await this.commandBus.execute<CreateCommentCommand>(
      new CreateCommentCommand(postId, user.id, inputDto.content),
    );

    return this.queryBus.execute<GetCommentByIdQuery>(
      new GetCommentByIdQuery(commentId, null),
    );
  }
}
