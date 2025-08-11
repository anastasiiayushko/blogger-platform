import { Injectable } from '@nestjs/common';
import { PostQueryRepository } from '../query-repository/post.query-repository';
import { PostViewDTO } from '../../api/view-dto/post.view-dto';
import { GetPostFilterContextInputDTO } from '../query-repository/dto/get-post-filter-context-input-dto';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';

@Injectable()
export class PostsExternalQueryRepository {
  constructor(private readonly postQueryRepository: PostQueryRepository) {}

  // async getByIdOrNotFoundFail(postId: string): Promise<PostViewDTO> {
  //   return this.postQueryRepository.getByIdOrNotFoundFail(postId);
  // }
  //
  // async getAll(
  //   query: GetPostQueryParams,
  //   filterContext: GetPostFilterContextInputDTO,
  // ): Promise<PaginatedViewDto<PostViewDTO[]>> {
  //   return this.postQueryRepository.getAll(query, filterContext);
  // }
}
