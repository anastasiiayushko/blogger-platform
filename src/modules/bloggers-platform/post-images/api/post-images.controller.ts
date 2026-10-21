import {
  Controller,
  Delete,
  Param,
  ParseFilePipeBuilder,
  Post,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { UuidValidationPipe } from '../../../../core/pipes/uuid-validation-transform-pipe';
import { MulterExceptionFilter } from '../filter/multer-exception.filter';
import { CommandBus } from '@nestjs/cqrs';
import { UploadPostImageCommand } from '../application/usecase/upload-post-image.usecase';
import { UploadFileStorage } from '../application/port/file-storage.port';

@Controller('posts')
export class PostImagesController {
  constructor(protected commandBus: CommandBus) {}

  @Post(':postId/images')
  @UseInterceptors(FilesInterceptor('files', 1))
  @UseFilters(MulterExceptionFilter)
  async uploadImages(
    @Param('postId', UuidValidationPipe) postId: string,
    @UploadedFiles(
      new ParseFilePipeBuilder()
        .addMaxSizeValidator({
          maxSize: 5 * 1024 * 1024,
        })
        .addFileTypeValidator({
          fileType: /(jpeg|png)$/,
        })
        .build(),
    )
    files: Array<Express.Multer.File>,
  ) {
    const inputFiles = files.map((file: Express.Multer.File) => ({
      mimetype: file.mimetype,
      size: file.size,
      buffer: file.buffer,
    }));
    return await this.commandBus.execute(
      new UploadPostImageCommand(postId, inputFiles[0]),
    );
  }

  @Delete(':imageId/images')
  async delete(@Param('imageId') imageId: string) {
    const objectKey =
      'posts/20000000-0000-4000-8000-000000000001/images/e6e71c62-f41d-425a-8a28-969668bfcde3.png';

    return {};
    // await this.fileStorageClient.delete(objectKey);
  }
}
