import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { CommentViewDTO } from '../../infrastructure/mapper/comment.view-dto';

export class GetCommentByIdQuery {
  constructor(
    public commentId: string,
    public userId: string | null = null,
  ) {}
}

@QueryHandler(GetCommentByIdQuery)
export class GetCommentByIdQueryHandler
  implements IQueryHandler<GetCommentByIdQuery, CommentViewDTO>
{
  constructor(
    private readonly commentQRepo: CommentsQueryRepository,
    // private readonly likeMapQueryService: LikeMapQueryService,
  ) {}

  async execute({
    commentId,
    userId,
  }: GetCommentByIdQuery): Promise<CommentViewDTO> {
    const comment = await this.commentQRepo.getByIdOrNotFoundFail(commentId);

    return comment;
  }
}
