export interface CreateQuestionPayload {
  body: string;
  correctAnswers: string[];
}

export class CreateQuestionInputDto implements CreateQuestionPayload {
  body: string;
  correctAnswers: string[];
}
