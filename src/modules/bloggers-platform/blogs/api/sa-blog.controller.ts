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
import { BlogInputDto } from './input-dto/blog.input-dto';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParamsInputDto } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecases';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecases';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecases';
import { GetBlogByIdQuery } from '../application/query-usecases/get-blog-by-id.query-usecase';
import { GetBlogsWithPagingQuery } from '../application/query-usecases/get-blogs-with-paging.query-usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { UuidValidationPipe } from '../../../../core/pipes/uuid-validation-transform-pipe';
import { BlogPostInputDto } from './input-dto/blog-post.input-dto';
import { PostViewDTO } from '../../posts/api/view-dto/post.view-dto';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecases';
import { GetPostByIdQuery } from '../../posts/application/query-usecases/get-post-by-id.query-handler';

@Controller('sa/blogs')
@SkipThrottle()
@UseGuards(BasicAuthGuard)
export class SaBlogController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
  ) {}

  /**
   * Get all blogs with pagination and filtering based on query parameters.
   *
   * @param {GetBlogsQueryParamsInputDto} query - The query parameters to filter and paginate the blogs.
   * @returns {PaginatedViewDto<BlogViewDto[]>} - A paginated list of blog view DTOs.
   */
  @Get()
  async getAll(
    @Query() query: GetBlogsQueryParamsInputDto,
  ): Promise<PaginatedViewDto<BlogViewDto[]>> {
    return this.queryBus.execute<GetBlogsWithPagingQuery>(
      new GetBlogsWithPagingQuery(query),
    );
  }

  /**
   * Create a new blog based on the provided input DTO.
   *
   * @param {BlogInputDto} inputDto - The input DTO containing the data for the new blog.
   * @returns {BlogViewDto} - The view DTO of the newly created blog.
   */

  @Post()
  async create(@Body() inputDto: BlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute<CreateBlogCommand>(
      new CreateBlogCommand(
        inputDto.name,
        inputDto.description,
        inputDto.websiteUrl,
      ),
    );
    return this.queryBus.execute<GetBlogByIdQuery>(
      new GetBlogByIdQuery(blogId),
    );
  }

  /**
   * Update an existing blog by its ID.
   *
   * @param {string} id - The unique identifier of the blog to update.
   * @param {BlogInputDto} inputDto - The updated data for the blog.
   * @returns {HttpStatus.NO_CONTENT} - A status indicating that the blog was successfully updated.
   */
  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', UuidValidationPipe) id: string,
    @Body() inputDto: BlogInputDto,
  ): Promise<void> {
    await this.commandBus.execute<UpdateBlogCommand>(
      new UpdateBlogCommand(id, inputDto),
    );
    return;
  }

  /**
   * Delete a blog by its ID.
   *
   * @param {string} id - The unique identifier of the blog to delete.
   * @returns {HttpStatus.NO_CONTENT} - A status indicating that the blog was successfully deleted.
   */

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', UuidValidationPipe) id: string): Promise<void> {
    await this.commandBus.execute<DeleteBlogCommand>(new DeleteBlogCommand(id));
    return;
  }

  /**
   * Create a new post for an existing blog by its ID.
   *
   * @param {string} blogId - The unique identifier of the blog to create the post for.
   * @param {BlogPostInputDto} inputDto - The input DTO containing the data for the new post.
   * @returns {PostViewDto | HttpStatus.NOT_FOUND} - The view DTO of the newly created post or a NOT_FOUND status if the blog does not exist.
   */
  @Post(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  async createPost(
    @Param('blogId', UuidValidationPipe) blogId: string,
    @Body() inputDto: BlogPostInputDto,
  ): Promise<PostViewDTO> {

    const postId = await this.commandBus.execute<CreatePostCommand>(
      new CreatePostCommand(
        blogId,
        inputDto.content,
        inputDto.shortDescription,
        inputDto.title,
      ),
    );
    return this.queryBus.execute(new GetPostByIdQuery(postId, null));
  }
}
