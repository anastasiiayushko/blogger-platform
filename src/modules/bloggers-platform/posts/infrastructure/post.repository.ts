import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostDocument, PostModelType } from '../domain/post.entity';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Types } from 'mongoose';

@Injectable()
export class PostRepository {
  constructor(@InjectModel(Post.name) protected PostModel: PostModelType) {}

  async save(post: PostDocument): Promise<PostDocument> {
    return await post.save();
  }

  async findById(id: string): Promise<PostDocument | null> {
    return this.PostModel.findById(id);
  }
  async getByIdOrNotFoundFail(id: string ): Promise<PostDocument> {
    const post = await this.PostModel.findById(id);
    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Post not found',
      });
    }
    return post;
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await this.PostModel.deleteOne({
      _id: new Types.ObjectId(id),
    });
    return !!result.deletedCount;
  }
}
