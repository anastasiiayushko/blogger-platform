import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.entity';
import { PostViewDTO } from '../../api/view-dto/post.view-dto';
import { GetPostQueryParams } from '../../api/input-dto/get-post-query-params.input-dto';
import { GetPostFilterContextInputDTO } from './dto/get-post-filter-context-input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { FilterQuery, Types } from 'mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectModel(Post.name) private readonly PostModel: PostModelType,
  ) {}

  async getByIdOrNotFoundFail(id: string): Promise<PostViewDTO> {
    const post = await this.PostModel.findOne({
      _id: id,
    });

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }

    return PostViewDTO.mapToView(post, 'None');
  }

  async getAll(
    query: GetPostQueryParams,
    filterContext?: GetPostFilterContextInputDTO,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    const filter: FilterQuery<Post> = {};

    if (filterContext?.blogId) {
      filter.blogId = new Types.ObjectId(filterContext.blogId);
    }

    const posts = await this.PostModel.find(filter)
      .sort({ [query.sortBy]: query.sortDirection })
      .skip(query.calculateSkip())
      .limit(query.pageSize)
      .lean();

    const totalCount = await this.PostModel.countDocuments(filter);
    return PaginatedViewDto.mapToView({
      items: posts.map((item) => PostViewDTO.mapToView(item, 'None')),
      page: query.pageNumber,
      totalCount: totalCount,
      size: query.pageSize,
    });
  }
}
