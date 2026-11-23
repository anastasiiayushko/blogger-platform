import { Injectable } from '@nestjs/common';
import {
  CreatePostImageDto,
  PostImagesRepositoryPort,
  PostImageStatus,
} from '../../application/port/post-images-repository.port';
import { PostImage } from '../../domain/post-image.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class OrmPostImagesRepository implements PostImagesRepositoryPort {
  constructor(
    @InjectRepository(PostImage)
    private readonly postImageRepository: Repository<PostImage>,
    private readonly dataSource: DataSource,
  ) {}
  async createPendingImage(
    image: PostImage,
    em?: EntityManager,
  ): Promise<PostImage> {
    const repository = em
      ? em.getRepository(PostImage)
      : this.postImageRepository;

    return await repository.save({
      objectKey: image.objectKey,
      mimeType: image.mimeType,
      size: image.size,
      postId: image.postId,
      status: image.status,
    });
  }
  async findByObjectKey(objectKey: string): Promise<PostImage | null> {
    return await this.postImageRepository.findOne({
      where: { objectKey: objectKey },
    });
  }
  async markFailed(objectKey: string): Promise<boolean> {
    const resultRow = await this.postImageRepository.query(
      `UPDATE post_images
       SET status=$1
       WHERE object_key = $2
         and status = $3 RETURNING id
      `,
      [PostImageStatus.failed, objectKey, PostImageStatus.pending],
    );
    return resultRow.length > 0;
  }
  async markAsReady(
    objectKey: string,
    metadata: {
      etag: string | null;
      checksum: string | null;
    },
  ) {
    const rawSql = await this.dataSource.query(
      `
        UPDATE post_images
        SET status   =$5,
            etag     = $3,
            checksum = $4
        WHERE object_key = $1
          AND status = $2 RETURNING id;
      `,
      [
        objectKey,
        PostImageStatus.pending,
        metadata.etag,
        metadata.checksum,
        PostImageStatus.ready,
      ],
    );

    return rawSql.length > 0;
  }

  async delete(): Promise<void> {}
}
