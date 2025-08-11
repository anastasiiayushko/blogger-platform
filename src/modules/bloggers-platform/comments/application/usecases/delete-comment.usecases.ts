import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CommentRepository } from '../../infrastructure/comment.repository';
import { Types } from 'mongoose';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';

export class DeleteCommentCommand {
  constructor(
    public commentId: string,
    public userId: string,
  ) {}
}

@CommandHandler(DeleteCommentCommand)
export class DeleteCommentHandler
  implements ICommandHandler<DeleteCommentCommand>
{
  constructor(protected commentRepo: CommentRepository) {}

  async execute({ commentId, userId }: DeleteCommentCommand): Promise<void> {
    const editUser = new Types.ObjectId(userId);
    const comment = await this.commentRepo.findOrNotFoundFail(commentId);
    const author = comment.commentatorInfo.userId;
    if (!author.equals(editUser)) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }
    await this.commentRepo.deleteById(commentId);
  }
}
