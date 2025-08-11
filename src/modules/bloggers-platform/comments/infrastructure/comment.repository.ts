import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentDocument,
  CommentModelType,
  Comment,
} from '../domain/comment.entity';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { Types } from 'mongoose';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectModel(Comment.name) protected commentModel: CommentModelType,
  ) {}

  async findOrNotFoundFail(id: string): Promise<CommentDocument> {
    const comment = await this.commentModel.findById(new Types.ObjectId(id));
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

  async deleteById(id: string): Promise<boolean> {
    const result = await this.commentModel.deleteOne({
      _id: new Types.ObjectId(id),
    });
    return result?.deletedCount >= 1;
  }
}
