import { CommentNewType, CommentPersistedType } from '../../domain/comment.entity';
import { CommentWithReactionSqlRow } from '../query/comments.query-repository';




class CommentatorInfoDTO  {
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
      userId: item.authorId,
      userLogin: item.authorLogin,
    };
    comment.likesInfo = {
      likesCount: item.likesCount,
      dislikesCount: item.dislikesCount,
      myStatus: item?.myStatus ?? 'None',
      // myStatus: item.myStatus,
    };
    comment.createdAt = item.createdAt.toISOString();

    return comment;
  }
}
