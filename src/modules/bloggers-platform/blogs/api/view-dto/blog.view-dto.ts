import { BlogDocument } from '../../domain/blog.odm-entity';
import { BlogSqlRow } from '../../infrastructure/blog.repository';

export class BlogViewDto {
  id: string;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: string;
  isMembership: boolean;

  /**
   * Converts a Mongoose BlogDocument into a BlogDocument.
   * @param {BlogDocument} blog - The blog document from the database.
   * @returns {BlogDocument} - The transformed user DTO.
   */
  static mapToView(blog: BlogSqlRow): BlogViewDto {
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
