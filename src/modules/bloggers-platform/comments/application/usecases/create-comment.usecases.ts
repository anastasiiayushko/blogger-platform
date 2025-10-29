import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { PostQueryRepository } from '../../../posts/infrastructure/query-repository/post.query-repository';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { Comment } from '../../domain/comment.entity';

export class CreateCommentCommand {
  constructor(
    public postId: string,
    public userId: string,
    public content: string,
  ) {}
}

@CommandHandler(CreateCommentCommand)
export class CreateCommentHandler
  implements ICommandHandler<CreateCommentCommand>
{
  constructor(
    protected postQueryRepository: PostQueryRepository,
    // protected userExternalQRepo: UsersExternalQuerySqlRepository,
    protected commentRepository: CommentRepository,
  ) {}

  async execute({
    postId,
    userId,
    content,
  }: CreateCommentCommand): Promise<string> {
    //::TODO нужно ли проверять на юзера так как у нас проверка только на валидность токина
    await this.postQueryRepository.getByIdOrNotFoundFail(postId);
    const comment = Comment.createInstance({
      content: content.trim(),
      postId: postId,
      userId: userId,
    });

    await this.commentRepository.save(comment);
    return comment.id;
  }
}
