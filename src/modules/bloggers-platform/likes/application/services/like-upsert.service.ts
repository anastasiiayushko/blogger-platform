import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Like, LikeDocument, LikeModelType } from '../../domain/like.entety';
import { LikeStatusEnum } from '../../domain/like-status.enum';
import { CreateLikeDomainDto } from '../../domain/dto/create-like-domain.dto';
import { LikeRepository } from '../../infrastucture/repository/like-repository';

@Injectable()
export class LikeUpsertService {
  constructor(
    @InjectModel(Like.name) protected likeModel: LikeModelType,
    protected likeRepo: LikeRepository,
  ) {}

  private async create(dto: CreateLikeDomainDto): Promise<string> {
    const newLike = this.likeModel.createInstance({
      parentId: dto.parentId,
      authorId: dto.authorId,
      status: dto.status,
      authorName: dto.authorName,
    });
    await this.likeRepo.save(newLike);
    return newLike._id.toString();
  }

  private async update(
    like: LikeDocument,
    newStatus: LikeStatusEnum,
  ): Promise<string> {
    like.updateStatus(newStatus);
    await this.likeRepo.save(like);
    return like._id.toString();
  }

  async upsert(dto: CreateLikeDomainDto): Promise<String> {
    const like = await this.likeRepo.findByParentsAndAuthor(
      [dto.parentId],
      dto.authorId,
    );

    if (like?.[0]) {
      return await this.update(like?.[0], dto.status);
    }

    return await this.create(dto);
  }
}
