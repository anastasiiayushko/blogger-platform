import { BadRequestException } from '@nestjs/common';
export enum AllowedImageMimeType {
  Jpeg = 'image/jpeg',
  Png = 'image/png',
}

//таблице соответствий
const MIME_TYPE_EXTENSION: Record<AllowedImageMimeType, string> = {
  [AllowedImageMimeType.Jpeg]: 'jpeg',
  [AllowedImageMimeType.Png]: 'png',
};

export class ImageMimeType {
  private constructor(public value: AllowedImageMimeType) {}

  static create(value: string): ImageMimeType {
    if (
      !Object.values(AllowedImageMimeType).includes(
        value as AllowedImageMimeType,
      )
    ) {
      throw new BadRequestException(`Invalid format "${value}"`);
    }
    return new ImageMimeType(value as AllowedImageMimeType);
  }
  getExtension(): string {
    return MIME_TYPE_EXTENSION[this.value];
  }
}
