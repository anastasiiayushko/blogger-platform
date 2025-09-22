import { UpdatePostCommand } from '../../../posts/application/usecases/update-post.usecases';
import { OmitType } from '@nestjs/swagger';

export class BlogPostInputDto extends OmitType(UpdatePostCommand, [
  'blogId',
  'postId',
]) {}
