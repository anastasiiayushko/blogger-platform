import { Trim } from '../../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from '../../../posts/domain/post.constraints';

export class BlogPostInputDto {
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
}