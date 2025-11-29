import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { Comment } from '../domain/comment.entity';

@Injectable()
export class CommentRepository {
  constructor(
    @InjectRepository(Comment) protected commentRepository: Repository<Comment>,
  ) {}



  async save(comment: Comment): Promise<Comment> {
    return await this.commentRepository.save(comment);
  }

  async softDeleteById(id: string) {
    await this.commentRepository.softDelete(id);
  }

  async findOrNotFoundFail(id: string): Promise<Comment> {
    const comment = await this.commentRepository.findOneBy({ id: id });
    if (!comment) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment not found',
      });
    }
    return comment;
  }
}
