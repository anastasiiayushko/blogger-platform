import { Command, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  PostImagesRepositoryPort,
  PostImageStatus,
} from '../port/post-images-repository.port';
import { FileStoragePort, StoredFile } from '../port/file-storage.port';
import { PostQueryRepository } from '../../../posts/infrastructure/query-repository/post.query-repository';
import { NotFoundException } from '@nestjs/common';
import { ImageMimeType } from '../../domain/value-objects/image-mime-type';
import { PostImageObjectKey } from '../../domain/value-objects/post-image-object-key';
import { PostRepository } from '../../../posts/infrastructure/post.repository';
import { DataSource, Not } from 'typeorm';
import { PostImage } from '../../domain/post-image.entity';
import {
  PostImageConstraintCountUpload,
  PostImageStateConflictException,
  PostImageUploadError,
} from '../errors/post-images.errors';

type ExecuteResultCommand = {
  objectKey: string;
};

type UploadFile = {
  mimetype: string;
  size: number;
  buffer: Buffer;
};
export class UploadPostImageCommand extends Command<ExecuteResultCommand> {
  private readonly allowedFileTypes = ['image/jpeg', 'image/png'];
  constructor(
    public postId: string,
    public uploadFile: UploadFile,
  ) {
    super();
  }
}

@CommandHandler(UploadPostImageCommand)
export class UploadPostImageHandler implements ICommandHandler<UploadPostImageCommand> {
  constructor(
    private readonly postRepository: PostRepository,
    private readonly postQueryRepository: PostQueryRepository,
    private readonly imageRepository: PostImagesRepositoryPort,
    private readonly storage: FileStoragePort,
    private readonly dataSource: DataSource,
  ) {}

  async execute(
    command: UploadPostImageCommand,
  ): Promise<ExecuteResultCommand> {
    const { postId, uploadFile } = command;
    const post = await this.postQueryRepository.getByIdOrNotFoundFail(postId);
    if (!post) {
      throw new NotFoundException('post not found');
    }
    const image = await this.createPendingImage(postId, uploadFile);

    let storedFile: StoredFile;

    try {
      storedFile = await this.storage.upload({
        body: uploadFile.buffer,
        contentType: image.mimeType,
        contentLength: String(image.size),
        objectKey: image.objectKey,
      });
    } catch (uploadError) {
      await this.imageRepository.markFailed(image.objectKey);
      // DOMAIN ERROR (НЕ УДАЛОСЬ ЗАГРУЗИТЬ файл)
      // можно создать свою домменую ошибку для клиента, что не удалось загрузить фото
      throw new PostImageUploadError(
        `'Failed to upload image to store' ${uploadError.message}`,
      );
    }

    try {
      const isReady = await this.imageRepository.markAsReady(image.objectKey, {
        // @ts-ignore
        etag: storedFile?.etag ?? null,
        // @ts-ignore
        checksum: storedFile?.checksum ?? null,
      });
      // Проверка на случай если в бд уже обновился статус, и нужно принять решенение
      // вызывать компенированую операцию для удаления файла из стора
      if (!isReady) {
        const existImage = await this.imageRepository.findByObjectKey(
          image.objectKey,
        );
        if (!existImage || existImage.status === PostImageStatus.failed) {
          throw new PostImageStateConflictException(image.objectKey);
        }
        if (existImage.status === PostImageStatus.pending) {
          //retray
          const isRepeatSetReady = await this.imageRepository.markAsReady(
            image.objectKey,
            {
              // @ts-ignore
              etag: storedFile?.etag ?? null,
              // @ts-ignore
              checksum: storedFile?.checksum ?? null,
            },
          );
          if (!isRepeatSetReady) {
            throw new PostImageStateConflictException(
              `Failed repeat ready for objectKey ${image.objectKey}`,
            );
          }
        }
      }
    } catch (storageError) {
      try {
        await this.storage.delete(image.objectKey);
      } catch (error) {
        console.error(error);
      } finally {
        await this.imageRepository.markFailed(image.objectKey);
      }
      throw new PostImageUploadError(
        `'Failed to upload image to store' ${storageError.message}`,
      );
      // DOMAIN ERROR (НЕ УДАЛОСЬ ЗАГРУЗИТЬ файл)
    }

    return { objectKey: image.objectKey };
  }

  async createPendingImage(
    postId: string,
    uploadFile: UploadFile,
  ): Promise<PostImage> {
    const mimeType = ImageMimeType.create(uploadFile.mimetype);
    const objectKey = PostImageObjectKey.create(
      postId,
      mimeType.getExtension(),
    );
    const postImage: PostImage = PostImage.create({
      postId: postId,
      objectKey: objectKey,
      mimeType: mimeType.value,
      size: uploadFile.size,
    });
    await this.dataSource.transaction(async (manager) => {
      await manager.query('SELECT ID FROM post where id=$1 FOR NO KEY UPDATE', [
        postId,
      ]);
      const count = await manager.getRepository(PostImage).count({
        where: { postId: postId, status: Not(PostImageStatus.failed) },
      });
      if (count >= 10) {
        throw new PostImageConstraintCountUpload(
          'One post can be contain 10 files',
        );
      }

      await this.imageRepository.createPendingImage(postImage, manager);
    });

    return postImage;
  }
}
