import { CommentDocument } from '../../domain/comment.entity';

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
  // postId: string;
  likesInfo: LikesInfoDTO;
  createdAt: string;

//::TODO setStatus adding enum type
  static mapToView(item: CommentDocument, setStatus: string): CommentViewDTO {
    const comment = new CommentViewDTO();
    comment.id = item._id.toString();
    comment.content = item.content;
    // comment.postId = item.postId.toString();
    comment.commentatorInfo = {
      userId: item.commentatorInfo.userId.toString(),
      userLogin: item.commentatorInfo.userLogin,
    };
    comment.likesInfo = {
      likesCount: item.likesInfo.likesCount,
      dislikesCount: item.likesInfo.dislikesCount,
      myStatus: setStatus,
    };
    comment.createdAt = item.createdAt.toISOString();

    return comment;
  }
}
