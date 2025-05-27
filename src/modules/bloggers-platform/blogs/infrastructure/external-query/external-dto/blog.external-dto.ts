import { BlogDocument } from '../../../domain/blog.entity';

export class BlogExternalDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;

  static mapToView(blog: BlogDocument): BlogExternalDto {
    const dto = new BlogExternalDto();
    dto.id = blog._id.toString();
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.isMembership = blog.isMembership;
    dto.createdAt = blog.createdAt.toISOString();
    return dto;
  }
}
