import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';
import { LikeStatusEnum } from '../../../../core/types/like-status.enum';
import { PostReaction } from '../domain/post-reactions.entity';


@Injectable()
export class PostReactionRepository {
  constructor(
    @InjectRepository(PostReaction)
    protected postReactionRepo: Repository<PostReaction>,
  ) {}

  async findByPostAndUserId(
    postId: string,
    userId: string,
  ): Promise<PostReaction | null> {
    const reaction = await this.postReactionRepo.findOneBy({
      postId: postId,
      userId: userId,
    });
    return reaction;
  }

  async save(reaction: PostReaction): Promise<void> {
    await this.postReactionRepo.save(reaction);
  }

  async findOrNotFoundFail(
    postId: string,
    userId: string,
  ): Promise<PostReaction> {
    const reaction = await this.postReactionRepo.findOneBy({
      postId: postId,
      userId: userId,
    });
    if (!reaction) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: 'Comment reaction not found',
      });
    }
    return reaction;
  }

  async softDeleteAllReactionByPostId(postId: string): Promise<void> {
    await this.postReactionRepo.softDelete({
      postId: postId,
    });
  }
}
