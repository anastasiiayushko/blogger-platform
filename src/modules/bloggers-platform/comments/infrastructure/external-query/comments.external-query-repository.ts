import { Injectable } from '@nestjs/common';
import { CommentsQueryRepository } from '../query/comments.query-repository';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';

@Injectable()
export class CommentsExternalQueryRepository {
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  async getAllCommentsQuery(
    query: GetCommentsQueryParams,
    filterContext: {
      postId: string;
    },
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    return this.commentsQueryRepository.getAll(query, filterContext);
  }
}
