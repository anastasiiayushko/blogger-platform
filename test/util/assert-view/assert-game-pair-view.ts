import { GamePairViewDto } from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/game-pair.view-dto';
import { GameStatusesEnum } from '../../../src/modules/quiz/quiz-game/domain/game/game-statuses.enum';
import { PlayerProgressViewDto } from '../../../src/modules/quiz/quiz-game/infrastructure/query/mapper/player-progress.view-dto';
import { assertPlayerProgress } from './assert-player-progress-view';
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
export const assertGamePairView = (
  actual: GamePairViewDto,
  expected: {
    firstPlayer: ExpectedPlayer;
    secondPlayer: ExpectedPlayer | null;
    status: GameStatusesEnum;
  },
) => {
  expect(actual.id).toEqual(expect.any(String));
  expect(actual.status).toEqual(expected.status);

  assertPlayerProgress(actual.firstPlayerProgress, {
    id: expected.firstPlayer?.id,
    login: expected.firstPlayer.login,
    score: expected.firstPlayer.score,
    answers: expected.firstPlayer.answers,
  });

  if (expected.status === GameStatusesEnum.pending) {
    expect(actual.status).toEqual(GameStatusesEnum.pending);

    expect(actual.questions).toBeNull();
    expect(new Date(actual.pairCreatedDate)).toBeInstanceOf(Date);
    expect(actual.startGameDate).toBeNull();
    expect(actual.finishGameDate).toBeNull();
    expect(actual.secondPlayerProgress).toBeNull();
    return;
  }

  expect(actual.secondPlayerProgress).not.toBeNull();
  expect(expected.secondPlayer).not.toBeNull();

  if (actual.secondPlayerProgress && expected.secondPlayer) {
    assertPlayerProgress(actual.secondPlayerProgress, {
      id: expected.secondPlayer?.id,
      login: expected.secondPlayer.login,
      score: expected.secondPlayer.score,
      answers: expected.secondPlayer.answers,
    });
  }

  if (expected.status === GameStatusesEnum.active) {
    expect(actual.status).toEqual(GameStatusesEnum.active);
    expect(actual.questions).toHaveLength(5);
    expect(new Date(actual.pairCreatedDate)).toBeInstanceOf(Date);
    expect(new Date(actual.startGameDate as unknown as string)).toBeInstanceOf(
      Date,
    );
    expect(actual.finishGameDate).toBeNull();
  }

  if (expected.status === GameStatusesEnum.finished) {
    expect(actual.status).toEqual(GameStatusesEnum.finished);
    expect(actual.questions).toHaveLength(5);
    expect(new Date(actual.pairCreatedDate)).toBeInstanceOf(Date);
    expect(new Date(actual!.startGameDate as unknown as string)).toBeInstanceOf(
      Date,
    );
    expect(
      new Date(actual!.finishGameDate as unknown as string),
    ).toBeInstanceOf(Date);
  }
};
