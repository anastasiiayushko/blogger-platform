import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostRepository } from '../../infrastructure/post.repository';
import { InjectModel } from '@nestjs/mongoose';
import { Post, PostModelType } from '../../domain/post.odm-entity';
import { BlogQueryRepository } from '../../../blogs/infrastructure/query/blog.query-repository';
import {
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  validate,
} from 'class-validator';
import { Trim } from '../../../../../core/decorators/transform/trim';
import {
  postContentConstraints,
  postShortDescConstraints,
  postTitleConstraints,
} from '../../domain/post.constraints';

//::TODO валидация команды
export class UpdatePostCommand {
  @Trim()
  @IsUUID()
  public readonly blogId: string;

  @Trim()
  @IsUUID()
  public readonly postId: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(postTitleConstraints.maxLength)
  public readonly title: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(postContentConstraints.maxLength)
  public readonly content: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @MaxLength(postShortDescConstraints.maxLength)
  public readonly shortDescription: string;

  constructor(inputDto: UpdatePostCommand) {
    this.blogId = inputDto.blogId;
    this.postId = inputDto.postId;
    this.title = inputDto.title;
    this.content = inputDto.content;
    this.shortDescription = inputDto.shortDescription;
  }
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostHandler implements ICommandHandler<UpdatePostCommand> {
  constructor(
    @InjectModel(Post.name) protected PostModel: PostModelType,
    protected postRepository: PostRepository,
    protected blogQueryRepository: BlogQueryRepository,
  ) {}

  async execute(cmd: UpdatePostCommand): Promise<void> {
    await validate(cmd);
    await this.blogQueryRepository.findOrNotFoundFail(cmd.blogId);
    const post = await this.postRepository.getByIdOrNotFoundFail(cmd.postId);

    post.updatePost({
      title: cmd.title,
      content: cmd.content,
      shortDescription: cmd.shortDescription,
    });

    await this.postRepository.save(post);
  }
}
