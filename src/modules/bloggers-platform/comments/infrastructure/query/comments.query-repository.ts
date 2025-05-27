import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CommentViewDTO } from '../../api/view-dto/comment.view-dto';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { GetCommentsQueryParams } from '../../api/input-dto/get-comments-query-params.input-dto';
import { FilterQuery, Types } from 'mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class CommentsQueryRepository {
  constructor(
    @InjectModel(Comment.name) private readonly CommentModel: CommentModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<CommentViewDTO> {
    const comment = await this.CommentModel.findOne({
      _id: id,
    });

    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }

    return CommentViewDTO.mapToView(comment, 'None');
  }

  async getAll(
    query: GetCommentsQueryParams,
    filterContext: { postId: string },
  ): Promise<PaginatedViewDto<CommentViewDTO[]>> {
    const filter: FilterQuery<Comment> = {
      postId: new Types.ObjectId(filterContext.postId),
    };

    const comments = await this.CommentModel.find(filterContext)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize);

    const totalCount = await this.CommentModel.countDocuments(filter);

    return PaginatedViewDto.mapToView({
      size: query.pageSize,
      totalCount: totalCount,
      page: query.pageNumber,
      items: comments.map((item) => CommentViewDTO.mapToView(item, 'None')),
    });
  }
}
