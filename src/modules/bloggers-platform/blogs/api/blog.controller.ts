import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogViewDto } from './view-dto/blog.view-dto';
import { GetBlogsQueryParamsInputDto } from './input-dto/get-blogs-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { GetBlogByIdQuery } from '../application/query-usecases/get-blog-by-id.query-usecase';
import { GetBlogsWithPagingQuery } from '../application/query-usecases/get-blogs-with-paging.query-usecase';
import { SkipThrottle } from '@nestjs/throttler';
import { UuidValidationPipe } from '../../../../core/pipes/uuid-validation-transform-pipe';

@Controller('blogs')
@SkipThrottle()
export class BlogController {
  constructor(
    protected commandBus: CommandBus,
    protected queryBus: QueryBus,
    // protected postQueryRepository: PostQueryRepository,
  ) {}

  /**
   * Find blog by id
   *
   * @param {string} id - The unique identifier of the blog.
   * @returns {BlogViewDto | HttpStatus.NOT_FOUND} - The blog view DTO or a NOT_FOUND status if the blog is not found.
   */
  @Get(':id')
  async getById(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<BlogViewDto> {
    return this.queryBus.execute<GetBlogByIdQuery>(new GetBlogByIdQuery(id));
  }

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
   * Get all posts for a specific blog by its ID with pagination and filtering.
   *
   * @param {string} blogId - The unique identifier of the blog.
   * @param {GetPostQueryParams} query - The query parameters to filter and paginate the posts.
   * @returns {PaginatedViewDto<PostViewDTO[]>} - A paginated list of post view DTOs.
   */
  // @Get(':blogId/posts')
  // @UseGuards(BearerOptionalJwtAuthGuard)
  // async getAllPosts(
  //   @Param('blogId', UuidValidationPipe) blogId: string,
  //   @Query() query: GetPostQueryParams,
  //   @OptionalCurrentUserFormRequest() user: UserContextDto | null,
  // ): Promise<PaginatedViewDto<PostViewDTO[]>> {
  //   await this.queryBus.execute<GetBlogByIdQuery>(new GetBlogByIdQuery(blogId));
  //   return this.postQueryRepository.getAll(
  //     query,
  //     { blogId: blogId },
  //     user?.id ?? null,
  //   );
  // }
}
