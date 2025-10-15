import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';

// Уточнённые типы Blog
export type BlogNew = Blog & { id: null; createdAt: null };
export type BlogPersisted = Blog & { id: string; createdAt: Date };

type PrimitiveType<ID> = {
  id: ID;
  name: string;
  description: string;
  websiteUrl: string;
  createdAt: Date | null;
  isMembership: boolean;
};

export class Blog {
  private constructor(
    /** null указывает на то что это ново созданная запись
     * значение атрибута устанавливается при создании строки
     * */
    public id: string | null,
    public name: string,
    public description: string,
    public websiteUrl: string,
    /** null указывает на то что это ново созданная запись,
     * значение атрибута устанавливается при создании строки
     * */
    public createdAt: Date | null,
    public isMembership: boolean,
  ) {}

  static createInstance(dto: CreateBlogDomainDto): BlogNew {
    return new Blog(
      null,
      dto.name,
      dto.description,
      dto.websiteUrl,
      null,
      false,
    ) as BlogNew;
  }

  updateBlog(dto: CreateBlogDomainDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }

  /** Для маппера */

  static toDomain(row: {
    id: string;
    name: string;
    description: string;
    websiteUrl: string;
    createdAt: Date;
    isMembership: boolean;
  }): BlogPersisted {
    return new Blog(
      row.id,
      row.name,
      row.description,
      row.websiteUrl,
      row.createdAt,
      row.isMembership,
    ) as BlogPersisted;
  }

  // 3) Перегрузки toPrimitive: тип результата выбирается по типу аргумента
  static toPrimitive(blog: BlogNew): PrimitiveType<null>;
  static toPrimitive(blog: BlogPersisted): PrimitiveType<string>;

  static toPrimitive(blog: Blog) {
    if (typeof blog.id === 'string') {
      // persisted
      return {
        id: blog.id,
        name: blog.name,
        description: blog.description,
        websiteUrl: blog.websiteUrl,
        createdAt: blog.createdAt,
        isMembership: blog.isMembership,
      } as PrimitiveType<string>;
    }
    // new
    return {
      id: null,
      name: blog.name,
      description: blog.description,
      websiteUrl: blog.websiteUrl,
      createdAt: null,
      isMembership: blog.isMembership,
    } as PrimitiveType<null>;
  }
}
