import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { PostQueryRepository } from '../../../posts/infrastructure/query/post.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';

export class GetCommentsByPostWithPagingCommand {
  constructor(
    public postId: string,
    public query: GetCommentsQueryParams,
  ) {}
}

@QueryHandler(GetCommentsByPostWithPagingCommand)
export class GetCommentsByPostWithPagingQueryHandler
  implements
    IQueryHandler<
      GetCommentsByPostWithPagingCommand,
      PaginatedViewDto<CommentViewDTO[]>
    >
{
  constructor(
    private readonly commentsQRepo: CommentsQueryRepository,
    protected readonly postQRepo: PostQueryRepository,
  ) {}

  async execute({
    postId,
    query,
  }: GetCommentsByPostWithPagingCommand): Promise<
    PaginatedViewDto<CommentViewDTO[]>
  > {
    await this.postQRepo.getByIdOrNotFoundFail(postId);
    return await this.commentsQRepo.getAll(query, { postId });
  }
}
