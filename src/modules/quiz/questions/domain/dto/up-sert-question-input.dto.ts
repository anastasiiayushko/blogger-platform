export interface IUpSertQuestionPayload {
  body: string;
  correctAnswers: string[];
}

export class UpSertQuestionInputDto implements IUpSertQuestionPayload {
  body: string;
  correctAnswers: string[];
}
