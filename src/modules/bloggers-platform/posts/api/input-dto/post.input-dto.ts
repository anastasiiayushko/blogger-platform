import { Trim } from '../../../../../core/decorators/transform/trim';
import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from '../../domain/post.entity';

export class PostInputDTO {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(postTitleConstraints.maxLength)
  title: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(postShortDescConstraints.maxLength)
  shortDescription: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(postContentConstraints.maxLength)
  content: string;

  @IsMongoId()
  blogId: string;
}
