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
import { PostQueryRepository } from '../infrastructure/query/post.query-repository';
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
import { CommentInputDto } from './input-dto/comment.input-dto';
import { GetCommentByIdQuery } from '../../comments/application/queries/get-comment-by-id.query';
import { GetCommentsByPostWithPagingCommand } from '../../comments/application/queries/get-comments-by-post-with-paging.query';

@Controller('posts')
export class PostController {
  constructor(
    private readonly postQueryRepository: PostQueryRepository,
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
  ) {}

  @Get()
  async getAll(@Query() query: GetPostQueryParams) {
    return this.postQueryRepository.getAll(query);
  }

  @Get(':id')
  async getById(
    @Param('id', ObjectIdValidationPipe) id: string,
  ): Promise<PostViewDTO> {
    return this.postQueryRepository.getByIdOrNotFoundFail(id);
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
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
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
  async getAllComment(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    return await this.queryBus.execute<GetCommentsByPostWithPagingCommand>(
      new GetCommentsByPostWithPagingCommand(postId, query),
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
    return await this.queryBus.execute<GetCommentByIdQuery>(
      new GetCommentByIdQuery(commentId),
    );
  }
}
