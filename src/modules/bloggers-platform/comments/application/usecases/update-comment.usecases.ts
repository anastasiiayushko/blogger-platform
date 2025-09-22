import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UsersExternalQueryRepository } from '../../../../user-accounts/infrastructure/external-query/users-external.query-repository';
import { Comment, CommentModelType } from '../../domain/comment.odm-entity';
import { InjectModel } from '@nestjs/mongoose';
import { CommentOdmRepository } from '../../infrastructure/comment.odm-repository';
import { Types } from 'mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class UpdateCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
    public content: string,
  ) {}
}

@CommandHandler(UpdateCommentCommand)
export class UpdateCommentHandler
  implements ICommandHandler<UpdateCommentCommand>
{
  constructor(
    @InjectModel(Comment.name) protected commentModel: CommentModelType,
    protected userExternalQRepo: UsersExternalQueryRepository,
    protected commentRepo: CommentOdmRepository,
  ) {}

  async execute({
    commentId,
    userId,
    content,
  }: UpdateCommentCommand): Promise<void> {
    const editUser = new Types.ObjectId(userId);
    const comment = await this.commentRepo.findOrNotFoundFail(commentId);
    const author = comment.commentatorInfo.userId;
    if (!author.equals(editUser)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }
    comment.updateContent(content);
    await this.commentRepo.save(comment);
  }
}
