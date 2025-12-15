import { PlayerProgressViewDto } from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/player-progress.view-dto';
import { AnswerStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/answer/answer-statuses.enum';

type ExpectedPlayer = {
  id?: string;
  login: string;
  score: number;
  answers: Array<{
    questionId: string;
    answerStatus: AnswerStatusesEnum;
  }>;
};

export const assertPlayerProgress = (
  actual: PlayerProgressViewDto,
  expected: ExpectedPlayer,
) => {
  expect(actual.player.id).toEqual(expected.id ?? expect.any(String));

  expect(actual.player.login).toBe(expected.login);
  expect(actual.score).toBe(expected.score);

  expect(actual.answers).toHaveLength(expected.answers.length);
  actual.answers.forEach((ans, idx) => {
    expect(ans.questionId).toBe(expected.answers[idx].questionId);

    expect(ans.answerStatus).toBe(expected.answers[idx].answerStatus);
    expect(new Date(ans.addedAt)).toBeInstanceOf(Date);
  });
};
