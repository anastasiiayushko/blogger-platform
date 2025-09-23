import { CommentWithReactionSqlRow } from '../query/comments.query-repository';

class CommentatorInfoDTO {
  userId: string;
  userLogin: string;
}

class LikesInfoDTO {
  likesCount: number;
  dislikesCount: number;
  myStatus: string;
}

export class CommentViewDTO {
  id: string;
  content: string;
  commentatorInfo: CommentatorInfoDTO;
  likesInfo: LikesInfoDTO;
  createdAt: string;

  //::TODO setStatus adding enum type
  static mapToView(item: CommentWithReactionSqlRow): CommentViewDTO {
    const comment = new CommentViewDTO();
    comment.id = item.id;
    comment.content = item.content;
    comment.commentatorInfo = {
      userId: item.commentatorId,
      userLogin: item.commentatorLogin,
    };
    comment.likesInfo = {
      likesCount: +item.likesCount,
      dislikesCount: +item.dislikesCount,
      myStatus: item.myStatus,
    };
    comment.createdAt = item.createdAt.toISOString();

    return comment;
  }
}
