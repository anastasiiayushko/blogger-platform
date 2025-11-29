export class QuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;

  static mapToView(domainEntity: {
    id: string;
    body: string;
    answers: string[];
    published: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): QuestionViewDto {
    const view = new QuestionViewDto();
    view.id = domainEntity.id;
    view.body = domainEntity.body;
    view.correctAnswers = domainEntity.answers;
    view.published = domainEntity.published;
    view.createdAt = domainEntity.createdAt.toISOString();
    view.updatedAt = domainEntity.updatedAt.toISOString();
    return view;
  }
}
