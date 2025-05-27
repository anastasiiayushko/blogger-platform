import { Controller, Get, Param } from '@nestjs/common';
import { CommentsQueryRepository } from '../infrastructure/query/comments.query-repository';
import { ObjectIdValidationPipe } from '../../../../core/pipes/object-id-validation-transform-pipe';

@Controller('comments')
export class CommentController {
  constructor(private commentsQueryRepository: CommentsQueryRepository) {}

  @Get(':id')
  async getById(@Param('id', ObjectIdValidationPipe) id: string) {
    return await this.commentsQueryRepository.getByIdOrNotFoundFail(id);
  }
}
