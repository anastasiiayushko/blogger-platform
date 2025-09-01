import { Trim } from '../../../../../core/decorators/transform/trim';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from '../../domain/post.constraints';

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

  @Trim()
  @IsString()
  @IsNotEmpty()
  blogId: string;
}
