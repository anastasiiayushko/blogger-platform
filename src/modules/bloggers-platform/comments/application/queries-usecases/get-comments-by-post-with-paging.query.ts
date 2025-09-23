import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '../../../posts/infrastructure/query-repository/post.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';

export class GetCommentsByPostWithPagingQuery {
  constructor(
    public postId: string,
    public query: GetCommentsQueryParams,
    public userId: string | null = null,
  ) {}
}

@QueryHandler(GetCommentsByPostWithPagingQuery)
export class GetCommentsByPostWithPagingQueryHandler
  implements
    IQueryHandler<
      GetCommentsByPostWithPagingQuery,
      PaginatedViewDto<CommentViewDTO[]>
    >
{
  constructor(
    protected commentsQueryRepository: CommentsQueryRepository,
    protected postQueryRepository: PostQueryRepository,
  ) {}

  async execute({
    postId,
    query,
    userId,
  }: GetCommentsByPostWithPagingQuery): Promise<
    PaginatedViewDto<CommentViewDTO[]>
  > {
    await this.postQueryRepository.getByIdOrNotFoundFail(postId);

    return await this.commentsQueryRepository.getAll(query, { postId }, userId);
  }
}
