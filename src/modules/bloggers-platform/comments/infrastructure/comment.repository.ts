import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentDocument,
  CommentModelType,
  Comment,
} from '../domain/comment.entity';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/domain-exception';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) protected commentModel: CommentModelType,
  ) {}

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(id);
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }
    return comment;
  }

  async save(comment: CommentDocument): Promise<CommentDocument> {
    return await comment.save();
  }
}
