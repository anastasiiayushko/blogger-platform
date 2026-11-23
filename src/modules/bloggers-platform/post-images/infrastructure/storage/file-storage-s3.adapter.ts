import { Inject, Injectable } from '@nestjs/common';
import {
  FileStoragePort,
  StoredFile,
  UploadFileStorage,
} from '../../application/port/file-storage.port';
import {
  DeleteObjectCommand,
  PutObjectAclCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

@Injectable()
export class FileStorageS3Adapter implements FileStoragePort {
  readonly bucketName = 'blogger-platform';
  constructor(@Inject('INTERNAL_S3_CLIENT') readonly s3Client: S3Client) {}

  async upload(input: UploadFileStorage): Promise<StoredFile> {
    const result = await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: input.objectKey,
        Body: input.body,
        ContentType: input.contentType,
      }),
    );

    const etag = result?.ETag ?? null;

    return {
      objectKey: input.objectKey,
      etag: etag,
      checksum: result.ChecksumCRC32,
    };
  }
  async delete(objectKey: string): Promise<void> {
    const result = await this.s3Client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: objectKey,
      }),
    );
    console.log('delete result', result);
  }
}
