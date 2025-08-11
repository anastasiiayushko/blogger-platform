
export class NewLikePostDomainDTO {
  userId: string;
  login: string;
  addedAt: Date;
}

export class UpdateExtendedLikesPostDomainDTO {
  likesCount: number;
  dislikesCount: number;
  newestLikes: NewLikePostDomainDTO[];
}
