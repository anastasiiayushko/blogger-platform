import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService, ConfigType } from '@nestjs/config';
import { S3Client } from '@aws-sdk/client-s3';
import { FileStoragePort } from '../../application/port/file-storage.port';
import { FileStorageS3Adapter } from './file-storage-s3.adapter';
import { fileStorageConfig } from './file-storage.config';

@Module({
  imports: [ConfigModule.forFeature(fileStorageConfig)],
  providers: [
    {
      provide: 'INTERNAL_S3_CLIENT',
      inject: [fileStorageConfig.KEY],
      useFactory: (config: ConfigType<typeof fileStorageConfig>) => {
        return new S3Client({
          region: 'auto',
          endpoint: config.endpoint,
          credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
          },
        });
      },
    },
    {
      provide: FileStoragePort,
      useClass: FileStorageS3Adapter,
    },
  ],
  exports: [FileStoragePort],
})
export class FileStorageModule {}
