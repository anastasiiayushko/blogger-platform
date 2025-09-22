import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsOdmQueryRepository } from '../../infrastructure/query/comments.odm-query-repository';
import { PostQueryRepository } from '../../../posts/infrastructure/query-repository/post.query-repository';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';
import { LikeStatusEnum } from '../../../likes/domain/like-status.enum';
import { LikeMapQueryService } from '../../../likes/application/services/like-map.query-service';

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
    protected commentsQRepo: CommentsOdmQueryRepository,
    protected postQRepo: PostQueryRepository,
    protected likeMapQueryService: LikeMapQueryService,
  ) {}

  async execute({
    postId,
    query,
    userId,
  }: GetCommentsByPostWithPagingQuery): Promise<
    PaginatedViewDto<CommentViewDTO[]>
  > {
    await this.postQRepo.getByIdOrNotFoundFail(postId);

    const result = await this.commentsQRepo.getAll(query, { postId });
    const parentIds = result.items.map((comment) => comment._id.toString());

    const statusLikesMap =
      await this.likeMapQueryService.getStatusLikesMapByParams(
        parentIds,
        userId,
      );

    return {
      ...result,
      items: result.items.map((comment) =>
        CommentViewDTO.mapToView(
          comment,
          statusLikesMap.get(comment._id.toString()) || LikeStatusEnum.None,
        ),
      ),
    };
  }
}
