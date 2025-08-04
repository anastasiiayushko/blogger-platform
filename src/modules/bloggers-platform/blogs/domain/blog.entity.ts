import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { CreateBlogDomainDto } from './dto/create-blog.domain.dto';
import { HydratedDocument, Model } from 'mongoose';

export const blogNameConstraints = {
  maxLength: 15,
};

export const blogDescriptionConstraints = {
  maxLength: 500,
};

export const blogWebsitUrlConstraints = {
  match: /^https:\/\/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+(\/[a-zA-Z0-9_-]+)*\/?$/,
  maxLength: 100,
};

@Schema({
  timestamps: true,
  optimisticConcurrency: true, //  Optimistic Concurrency Control (OCC) — через versionKey
})
export class Blog {
  /**
   * Name of the blog
   * @type{string}
   * @required
   * @maxlength - 15
   * @trim
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: blogNameConstraints.maxLength,
  })
  name: string;

  /**
   * Description of the blog
   * @type{string}
   * @required
   * @maxlength - 500
   * @trim
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: blogDescriptionConstraints.maxLength,
  })
  description: string;

  /**
   * Link to Website url or social network of the blog author
   * @type{string}
   * @required
   * @maxlength - 100
   * @trim
   * @match
   */
  @Prop({
    type: String,
    required: true,
    trim: true,
    maxlength: blogWebsitUrlConstraints.maxLength,
    match: [blogWebsitUrlConstraints.match, 'Invalid URL format'],
  })
  websiteUrl: string;

  /**
   * isMembership of the blog
   * @type{boolean}
   * @required
   */
  @Prop({ type: Boolean, required: true })
  isMembership: boolean;

  /**
   * Creation timestamp
   * Explicitly defined despite timestamps: true
   * properties without @Prop for typescript so that they are in the class instance (or in instance methods)
   * @type {Date}
   */
  createdAt: Date;
  updatedAt: Date;

  /**
   * Factory method for create entity blog
   * @param{CreateBlogDomainDto}
   * @return{BlogDocument}
   * */
  static createInstance(dto: CreateBlogDomainDto) {
    const blog = new this();
    blog.name = dto.name;
    blog.description = dto.description;
    blog.websiteUrl = dto.websiteUrl;
    blog.isMembership = false;
    return blog as BlogDocument;
  }

  updateBlog(dto: CreateBlogDomainDto) {
    this.name = dto.name;
    this.description = dto.description;
    this.websiteUrl = dto.websiteUrl;
  }
}

export const BlogSchema = SchemaFactory.createForClass(Blog);
//Register methods entity in schema
BlogSchema.loadClass(Blog);

// Typing document
export type BlogDocument = HydratedDocument<Blog>;

//Typing model + static methods
export type BlogModelType = Model<BlogDocument> & typeof Blog;
