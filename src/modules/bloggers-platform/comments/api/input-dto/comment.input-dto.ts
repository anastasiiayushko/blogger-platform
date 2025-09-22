import { Trim } from '../../../../../core/decorators/transform/trim';
import { IsString, Length } from 'class-validator';
import { commentContentConstraints } from '../../domain/comment.constraints';

export class CommentInputDto {
  @Trim()
  @IsString()
  @Length(
    commentContentConstraints.minLength,
    commentContentConstraints.maxLength,
  )
  content: string;
}
