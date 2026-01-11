import { QuestionRowRaw } from '../../infrastructure/question.query-repository';
import { Question } from '../../domain/question.entity';

export class QuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string | null = null;

  static mapToView(raw: QuestionRowRaw | Question): QuestionViewDto {
    const view = new QuestionViewDto();
    view.id = raw.id;
    view.body = raw.body;
    view.correctAnswers = raw.answers;
    view.published = raw.published;

    const createdAt = new Date(raw.createdAt);
    const updatedAt = raw.updatedAt ? new Date(raw.updatedAt) : null;

    view.createdAt = createdAt.toISOString();
    view.updatedAt =
      !updatedAt || updatedAt.getTime() === createdAt.getTime()
        ? null
        : updatedAt.toISOString();
    return view;
  }
}
