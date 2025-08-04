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
import { BlogQueryRepository } from '../infrastructure/query/blog.query-repository';
import { GetBlogsQueryParamsInputDto } from './input-dto/get-blogs-query-params.input-dto';
import { PostExternalInputDto } from '../../posts/application/external-service/dto/post.external-input-dto';
import { GetPostQueryParams } from '../../posts/api/input-dto/get-post-query-params.input-dto';
import { PostViewDTO } from '../../posts/api/view-dto/post.view-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-transform-pipe';
import { PostQueryRepository } from '../../posts/infrastructure/query/post.query-repository';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/usecases/create-blog.usecases';
import { BasicAuthGuard } from '../../../user-accounts/guards/basic/basic-auth.guard';
import { DeleteBlogCommand } from '../application/usecases/delete-blog.usecases';
import { UpdateBlogCommand } from '../application/usecases/update-blog.usecases';
import { CreatePostCommand } from '../../posts/application/usecases/create-post.usecases';

@Controller('blogs')
export class BlogController {
  constructor(
    private readonly blogQueryRepository: BlogQueryRepository,
    private readonly postQueryRepository: PostQueryRepository,
    private commandBus: CommandBus,
  ) {}

  /**
   * Find blog by id
   *
   * @param {string} id - The unique identifier of the blog.
   * @returns {BlogViewDto | HttpStatus.NOT_FOUND} - The blog view DTO or a NOT_FOUND status if the blog is not found.
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<BlogViewDto> {
    return this.blogQueryRepository.findOrNotFoundFail(id);
  }

  /**
   * Get all blogs with pagination and filtering based on query parameters.
   *
   * @param {GetBlogsQueryParamsInputDto} query - The query parameters to filter and paginate the blogs.
   * @returns {PaginatedViewDto<BlogViewDto[]>} - A paginated list of blog view DTOs.
   */
  @Get()
  async getAll(@Query() query: GetBlogsQueryParamsInputDto) {
    return this.blogQueryRepository.getAll(query);
  }

  /**
   * Create a new blog based on the provided input DTO.
   *
   * @param {BlogInputDto} inputDto - The input DTO containing the data for the new blog.
   * @returns {BlogViewDto} - The view DTO of the newly created blog.
   */
  @UseGuards(BasicAuthGuard)
  @Post()
  async create(@Body() inputDto: BlogInputDto): Promise<BlogViewDto> {
    const blogId = await this.commandBus.execute<CreateBlogCommand>(
      new CreateBlogCommand(
        inputDto.name,
        inputDto.description,
        inputDto.websiteUrl,
      ),
    );
    return await this.blogQueryRepository.findOrNotFoundFail(blogId);
  }

  /**
   * Update an existing blog by its ID.
   *
   * @param {string} id - The unique identifier of the blog to update.
   * @param {BlogInputDto} inputDto - The updated data for the blog.
   * @returns {HttpStatus.NO_CONTENT} - A status indicating that the blog was successfully updated.
   */
  @Put(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async update(
    @Param('id', ObjectIdValidationPipe) id: string,
    @Body() inputDto: BlogInputDto,
  ) {
    return await this.commandBus.execute<UpdateBlogCommand>(
      new UpdateBlogCommand(id, inputDto),
    );
    // return await this.blogService.update(id, inputDto);
  }

  /**
   * Delete a blog by its ID.
   *
   * @param {string} id - The unique identifier of the blog to delete.
   * @returns {HttpStatus.NO_CONTENT} - A status indicating that the blog was successfully deleted.
   */

  @Delete(':id')
  @UseGuards(BasicAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id', ObjectIdValidationPipe) id: string) {
    return await this.commandBus.execute<DeleteBlogCommand>(
      new DeleteBlogCommand(id),
    );
  }

  /**
   * Get all posts for a specific blog by its ID with pagination and filtering.
   *
   * @param {string} blogId - The unique identifier of the blog.
   * @param {GetPostQueryParams} query - The query parameters to filter and paginate the posts.
   * @returns {PaginatedViewDto<PostViewDTO[]>} - A paginated list of post view DTOs.
   */
  @Get(':blogId/posts')
  async getAllPosts(
    @Param('blogId', ObjectIdValidationPipe) blogId: string,
    @Query() query: GetPostQueryParams,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    await this.blogQueryRepository.findOrNotFoundFail(blogId);
    return await this.postQueryRepository.getAll(query, {
      blogId: blogId,
    });
  }

  /**
   * Create a new post for an existing blog by its ID.
   *
   * @param {string} blogId - The unique identifier of the blog to create the post for.
   * @param {PostExternalInputDto} inputDto - The input DTO containing the data for the new post.
   * @returns {PostViewDto | HttpStatus.NOT_FOUND} - The view DTO of the newly created post or a NOT_FOUND status if the blog does not exist.
   */
  @Post(':blogId/posts')
  @UseGuards(BasicAuthGuard)
  async createPost(
    @Param('blogId', ObjectIdValidationPipe) blogId: string,
    @Body() inputDto: PostExternalInputDto,
  ): Promise<PostViewDTO> {
    const postId = await this.commandBus.execute<CreatePostCommand>(
      new CreatePostCommand(
        blogId,
        inputDto.content,
        inputDto.shortDescription,
        inputDto.title,
      ),
    );
    return await this.postQueryRepository.getByIdOrNotFoundFail(postId);
  }
}
