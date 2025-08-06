import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CommentsQueryRepository } from '../../infrastructure/query/comments.query-repository';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';

export class GetCommentByIdQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetCommentByIdQuery)
export class GetCommentByIdQueryHandler
  implements IQueryHandler<GetCommentByIdQuery, CommentViewDTO>
{
  constructor(private readonly commentQRepo: CommentsQueryRepository) {}

  async execute({ id }: GetCommentByIdQuery) {
    return await this.commentQRepo.getByIdOrNotFoundFail(id);
  }
}
