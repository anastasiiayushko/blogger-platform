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
} from '@nestjs/common';
import { PostInputDTO } from './input-dto/post.input-dto';
import { PostService } from '../application/post.service';
import { PostViewDTO } from './view-dto/post.view-dto';
import { PostQueryRepository } from '../infrastructure/query/post.query-repository';
import { GetPostQueryParams } from './input-dto/get-post-query-params.input-dto';
import { GetCommentsQueryParams } from '../../comments/api/input-dto/get-comments-query-params.input-dto';
import { CommentsExternalQueryRepository } from '../../comments/infrastructure/external-query/comments.external-query-repository';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommentViewDTO } from '../../comments/api/view-dto/comment.view-dto';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-transform-pipe';
import { CommandBus } from '@nestjs/cqrs';
import { CreatePostCommand } from '../application/usecases/create-post.usecases';

@Controller('posts')
export class PostController {
  constructor(
    private readonly postService: PostService,
    private readonly postQueryRepository: PostQueryRepository,
    private readonly commentsExternalQueryRepository: CommentsExternalQueryRepository,
    protected commandBus: CommandBus,
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
  async create(@Body() postInput: PostInputDTO): Promise<PostViewDTO> {
    const postId = await this.commandBus.execute<CreatePostCommand>(
      new CreatePostCommand(
        postInput.blogId,
        postInput.content,
        postInput.shortDescription,
        postInput.title,
      ),
    );
    // const postId = await this.postService.create(postInput);
    return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(@Param('id') id: string, @Body() postInput: PostInputDTO) {
    return await this.postService.update(id, postInput);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string) {
    await this.postQueryRepository.getByIdOrNotFoundFail(id);
    return this.postService.deleteById(id);
  }

  @Get(':postId/comments')
  async getAllComment(
    @Param('postId') postId: string,
    @Query() query: GetCommentsQueryParams,
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    await this.postQueryRepository.getByIdOrNotFoundFail(postId);
    return this.commentsExternalQueryRepository.getAllCommentsQuery(query, {
      postId,
    });
  }
}
