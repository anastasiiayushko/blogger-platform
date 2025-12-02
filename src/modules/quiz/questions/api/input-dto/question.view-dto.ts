import { QuestionRowRaw } from '../../infrastructure/question.query-repository';
import { Question } from '../../domain/question.entity';

export class QuestionViewDto {
  id: string;
  body: string;
  correctAnswers: string[];
  published: boolean;
  createdAt: string;
  updatedAt: string;

  static mapToView(raw: QuestionRowRaw | Question): QuestionViewDto {
    const view = new QuestionViewDto();
    view.id = raw.id;
    view.body = raw.body;
    view.correctAnswers = raw.answers;
    view.published = raw.published;
    view.createdAt = raw.createdAt.toISOString();
    view.updatedAt = raw.updatedAt.toISOString();
    return view;
  }
}
