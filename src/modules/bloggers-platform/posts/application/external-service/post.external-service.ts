import { Injectable } from '@nestjs/common';
import { PostService } from '../post.service';
import { PostExternalInputDto } from './dto/post.external-input-dto';

@Injectable()
export class PostExternalService {
  constructor(private postService: PostService) {}

  async createPostForBlog(
    blogId: string,
    inputDto: PostExternalInputDto,
  ): Promise<string> {
    return await this.postService.create({ blogId, ...inputDto });
  }
}
