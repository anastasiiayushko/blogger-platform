import { CommentWithReactionSqlRow } from '../../infrastructure/query/comments.query-repository';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';

export class CommentViewDTO {
  id: string;
  content: string;
  commentatorInfo: {
    userId: string;
    userLogin: string;
  };
  likesInfo: {
    likesCount: number;
    dislikesCount: number;
    myStatus: LikeStatusEnum;
  };
  createdAt: string;

  static mapToView(item: CommentWithReactionSqlRow): CommentViewDTO {
    const comment = new CommentViewDTO();
    comment.id = item.id;
    comment.content = item.content;
    comment.commentatorInfo = {
      userId: item.userId,
      userLogin: item.userLogin,
    };
    comment.likesInfo = {
      likesCount: item.likesCount,
      dislikesCount: item.dislikesCount,
      myStatus: item.myStatus,
    };
    comment.createdAt = item.createdAt;

    return comment;
  }
}
