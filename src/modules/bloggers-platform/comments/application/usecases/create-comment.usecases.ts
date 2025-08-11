import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users-external.query-repository';
import { PostQueryRepository } from '../../../posts/infrastructure/query-repository/post.query-repository';
import { Comment, CommentModelType } from '../../domain/comment.entity';
import { InjectModel } from '@nestjs/mongoose';
import { CommentRepository } from '../../infrastructure/comment.repository';

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
    @InjectModel(Comment.name) protected commentModel: CommentModelType,
    protected postQRepo: PostQueryRepository,
    protected userExternalQRepo: UsersExternalQueryRepository,
    protected commentRepo: CommentRepository,
  ) {}

  async execute({
    postId,
    userId,
    content,
  }: CreateCommentCommand): Promise<string> {
    await this.postQRepo.getByIdOrNotFoundFail(postId);
    const user = await this.userExternalQRepo.findOrNotFoundFail(userId);
    const comment = this.commentModel.createInstance({
      content: content.trim(),
      postId: postId,
      userId: userId,
      userLogin: user.login,
    });
    console.log({
      content: content.trim(),
      postId: postId,
      userId: userId,
      userLogin: user.login,
    });
    await this.commentRepo.save(comment);

    return comment._id.toString();

  }
}
