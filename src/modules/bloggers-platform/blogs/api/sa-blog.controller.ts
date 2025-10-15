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
import { BlogQueryRepository } from '../infrastructure/query/blog.query-repository';
import { PostViewDTO } from '../../posts/api/view-dto/post.view-dto';
import { GetPostByIdQuery } from '../../posts/application/query-usecases/get-post-by-id.query-handler';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecases';
import { BlogPostInputDto } from './input-dto/blog-post.input-dto';
import { GetPostQueryParams } from '../../posts/api/input-dto/get-post-query-params.input-dto';
import { GetPostsWithPagingQuery } from '../../posts/application/query-usecases/get-posts-with-paging.query-handler';
import { UpdatePostCommand } from '../../posts/application/usecases/update-post.usecases';
import { DeletePostCommand } from '../../posts/application/usecases/delete-post.usecases';

@Controller('sa/blogs')
@SkipThrottle()
@UseGuards(BasicAuthGuard)
export class SaBlogController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
    protected blogQueryRepository: BlogQueryRepository,
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

  /**
   * Get posts for blog with paging and sorting.
   *
   * @param {string} blogId - The unique identifier of the blog to find the post for.
   * @query {GetPostQueryParams} queryParams - The query params for searching posts .
   * @returns {PaginatedViewDto<PostViewDTO[]> | HttpStatus.NOT_FOUND} -
   */
  @Get(':blogId/posts')
  async getPostsWithPaging(
    @Param('blogId', UuidValidationPipe) blogId: string,
    @Query() queryParams: GetPostQueryParams,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    await this.blogQueryRepository.findOrNotFoundFail(blogId);
    return this.queryBus.execute(
      new GetPostsWithPagingQuery(null, queryParams, { blogId: blogId }),
    );
  }

  /**
   * Update existing post by id with InputModel
   *
   * @param {string} blogId - The unique identifier of the blog to update the post for.
   * @param {string} postId - The unique identifier of the postId.
   * @param {BlogPostInputDto} inputDto - The input DTO containing the data for the update post.
   * @returns {HttpStatus.NO_CONTENT | HttpStatus.NOT_FOUND}
   */
  @Put(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updatePost(
    @Param('blogId', UuidValidationPipe) blogId: string,
    @Param('postId', UuidValidationPipe) postId: string,
    @Body() inputDto: BlogPostInputDto,
  ): Promise<void> {
    return this.commandBus.execute<UpdatePostCommand>(
      new UpdatePostCommand({
        blogId,
        postId,
        content: inputDto.content,
        shortDescription: inputDto.shortDescription,
        title: inputDto.title,
      }),
    );
  }

  /**
   * Delete post specified by id
   *
   * @param {string} blogId - The unique identifier of the blog to update the post for.
   * @param {string} postId - The unique identifier of the postId.
   * @returns {HttpStatus.NO_CONTENT | HttpStatus.NOT_FOUND}
   */
  @Delete(':blogId/posts/:postId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deletePost(
    @Param('blogId', UuidValidationPipe) blogId: string,
    @Param('postId', UuidValidationPipe) postId: string,
  ): Promise<void> {
    await this.blogQueryRepository.findOrNotFoundFail(blogId);
    return this.commandBus.execute<DeletePostCommand>(new DeletePostCommand(postId));
  }
}
