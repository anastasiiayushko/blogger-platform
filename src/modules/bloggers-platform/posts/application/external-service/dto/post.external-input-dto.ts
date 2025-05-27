import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { Trim } from '../../../../../../core/decorators/transform/trim';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from '../../../domain/post.entity';

export class PostExternalInputDto {
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
