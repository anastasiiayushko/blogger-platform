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
    protected postQRepo: PostQueryRepository,
    // protected userExternalQRepo: UsersExternalQuerySqlRepository,
    protected commentRepository: CommentRepository,
  ) {}

  async execute({
    postId,
    userId,
    content,
  }: CreateCommentCommand): Promise<string> {
    //::TODO нужно ли проверять на юзера
    await this.postQRepo.getByIdOrNotFoundFail(postId);
    // const user = await this.userExternalQRepo.findById(userId);
    const comment = Comment.createInstance({
      content: content.trim(),
      postId: postId,
      userId: userId,
    });

    const commentSaved = await this.commentRepository.save(comment);
    return commentSaved.id as string;
  }
}
