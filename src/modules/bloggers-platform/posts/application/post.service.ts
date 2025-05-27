import { Injectable } from '@nestjs/common';
import { Post, PostModelType } from '../domain/post.entity';
import { PostRepository } from '../infrastructure/post.repository';
import { InjectModel } from '@nestjs/mongoose';
import { BlogsExternalQueryRepository } from '../../blogs/infrastructure/external-query/blogs.external-query-repository';
import { PostInputDTO } from '../api/input-dto/post.input-dto';

@Injectable()
export class PostService {
  constructor(
    @InjectModel(Post.name) protected PostModel: PostModelType,
    protected postRepository: PostRepository,
    protected blogExternalQueryRepository: BlogsExternalQueryRepository,
  ) {}

  async create(dto: PostInputDTO): Promise<string> {
    console.log(dto);
    const blog = await this.blogExternalQueryRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );

    const post = this.PostModel.createInstance({
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
      blogId: blog.id,
      blogName: blog.name,
    });

    await this.postRepository.save(post);
    return post._id.toString();
  }

  async update(id: string, dto: PostInputDTO) {
    const blog = await this.blogExternalQueryRepository.getByIdOrNotFoundFail(
      dto.blogId,
    );
    const post = await this.postRepository.getByIdOrNotFoundFail(id);

    post.updatePost({
      title: dto.title,
      content: dto.content,
      shortDescription: dto.shortDescription,
      blogId: blog.id,
      blogName: blog.name,
    });

    await this.postRepository.save(post);
  }

  async deleteById(id: string): Promise<boolean> {
    return await this.postRepository.deleteById(id);
  }
}
