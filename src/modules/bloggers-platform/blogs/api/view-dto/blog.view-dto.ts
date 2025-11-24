import { Blog } from '../../domain/blog.entity';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;

  /**
   * Converts a Model BlogD into a BlogViewDto.
   * @param {Blog} blog - The blog model from the database.
   * @returns {BlogViewDto} - The transformed user DTO.
   */
  static mapToView(blog: Blog): BlogViewDto {
    const dto = new BlogViewDto();
    dto.id = blog.id;
    dto.name = blog.name;
    dto.description = blog.description;
    dto.websiteUrl = blog.websiteUrl;
    dto.isMembership = blog.isMembership;
    dto.createdAt = blog.createdAt.toISOString();
    return dto;
  }
}
