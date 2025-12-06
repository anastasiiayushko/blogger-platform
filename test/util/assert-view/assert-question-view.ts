import { QuestionViewDto } from '../../../src/modules/quiz/sa-question/api/input-dto/question.view-dto';

export const assertQuestionView = (
  actual: QuestionViewDto,
  expected: {
    body: string;
    correctAnswers: string[];
    published?: boolean;
  },
) => {
  expect(actual.id).toEqual(expect.any(String));
  expect(actual.published).toBe(expected.published);
  expect(actual.body).toBe(expected.body.trim());

  expect(actual.correctAnswers).toEqual(expected.correctAnswers);

  expect(actual.createdAt).toEqual(expect.any(String));

  expect(actual.updatedAt).toEqual(expect.any(String));
};
