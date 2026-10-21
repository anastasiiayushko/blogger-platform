import { PostImage } from '../../domain/post-image.entity';
import { EntityManager } from 'typeorm';

export enum PostImageStatus {
  pending = 'pending',
  ready = 'ready',
  failed = 'failed',
}

export declare type CreatePostImageDto = {
  postId: string;
  objectKey: string;
  mimeType: string;
  size: number;
};
export abstract class PostImagesRepositoryPort {
  abstract createPendingImage(
    input: PostImage,
    em?: EntityManager,
  ): Promise<PostImage>;
  abstract findByObjectKey(objectKey: string): Promise<PostImage | null>;
  abstract markAsReady(
    objectKey: string,
    metadata: {
      etag: string | null;
      checksum: string | null;
    },
  ): Promise<boolean>;
  abstract markFailed(objectKey: string): Promise<boolean>;
  // abstract mark(
  //   objectKey: string,
  //   currentStatus: PostImageStatus,
  //   markStatus: PostImageStatus,
  // ): Promise<boolean>;
  abstract delete(): Promise<void>;
}
