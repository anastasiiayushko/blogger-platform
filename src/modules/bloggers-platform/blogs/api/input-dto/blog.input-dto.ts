import {
  IsNotEmpty,
  IsString,
  IsUrl,
  Matches,
  MaxLength,
} from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';
import {
  blogDescriptionConstraints,
  blogNameConstraints,
  blogWebsitUrlConstraints,
} from '../../domain/blog.entity';

export class BlogInputDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(blogNameConstraints.maxLength)
  name: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(blogDescriptionConstraints.maxLength)
  description: string;

  @Trim()
  @IsUrl()
  @IsNotEmpty()
  @MaxLength(blogWebsitUrlConstraints.maxLength)
  @Matches(blogWebsitUrlConstraints.match)
  websiteUrl: string;
}
