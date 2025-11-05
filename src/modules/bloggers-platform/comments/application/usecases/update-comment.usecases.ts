import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { CommentRepository } from '../../infrastructure/comment.repository';

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
  constructor(protected commentRepository: CommentRepository) {}

  async execute({
    commentId,
    userId,
    content,
  }: UpdateCommentCommand): Promise<void> {
    const comment = await this.commentRepository.findOrNotFoundFail(commentId);
    const isNotMyComment = !comment.isMyComment(userId)

    if (isNotMyComment) {
      throw new DomainException({
        code: DomainExceptionCode.Forbidden,
      });
    }

    comment.updateContent({ content: content });
    await this.commentRepository.save(comment);
  }
}
