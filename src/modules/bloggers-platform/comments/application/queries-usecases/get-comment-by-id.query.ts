import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';
import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { LikeMapQueryService } from '../../../likes/application/services/like-map.query-service';

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
    private readonly likeMapQueryService: LikeMapQueryService,
  ) {}

  async execute({
    commentId,
    userId,
  }: GetCommentByIdQuery): Promise<CommentViewDTO> {
    const comment = await this.commentQRepo.getByIdOrNotFoundFail(commentId);
    let status: LikeStatusEnum = LikeStatusEnum.None;

    if (userId) {
      const likeMap = await this.likeMapQueryService.getStatusLikesMapByParams(
        [commentId],
        userId,
      );
      status = likeMap.get(commentId) || LikeStatusEnum.None;
    }

    return CommentViewDTO.mapToView(comment, status);
  }
}
