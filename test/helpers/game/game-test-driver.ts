import { Game } from '../../../src/modules/quiz/quiz-game/domain/game/game.entity';
import { Question } from '../../../src/modules/quiz/sa-question/domain/question.entity';
import {
  RecordCurrentAnswerCommand,
  RecordCurrentAnswerHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/record-current-answer.usecese';
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  GamePairConnectionCmd,
  GamePairConnectionHandler,
} from '../../../src/modules/quiz/quiz-game/features/pair-game/application/usecases/game-pair-connection.usecese';

export function gameTestDriver(app: INestApplication) {
  let gamePairConnectionHandler;
  let recordCurrentAnswerHandler;
  let dataSource: DataSource;

  gamePairConnectionHandler = app.get(GamePairConnectionHandler);
  recordCurrentAnswerHandler = app.get(RecordCurrentAnswerHandler);
  dataSource = app.get(DataSource);

  async function newGame(
    firstUserId: string,
    secondUserId: string,
  ): Promise<string> {
    await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(firstUserId),
    );
    return await gamePairConnectionHandler.execute(
      new GamePairConnectionCmd(secondUserId),
    );
  }

  return async function gameRunner(
    correctAnswersPlayer1: number = 0,
    correctAnswersPlayer2: number = 0,
    whoStartFirst: 'first' | 'second' = 'first',
    firsPlayerUserId: string,
    secondPlayerUserId: string,
  ) {
    const answersPlayer1:string[] = [];
    const answersPlayer2:string[] = [];

    const gameId = await newGame(firsPlayerUserId, secondPlayerUserId);
    const game = await dataSource.getRepository(Game).findOne({
      where: { id: gameId },
      relations: { questions: { question: true } },
      order: {
        questions: {
          order: 'ASC',
        },
      },
    });
    const gameQuestions = game!.questions;
    const positionQuestion = [0, 1, 2, 3, 4];

    const firstUserId =
      whoStartFirst === 'first' ? firsPlayerUserId : secondPlayerUserId;
    const secondUserId =
      whoStartFirst === 'first' ? secondPlayerUserId : firsPlayerUserId;

    const correctAnswersForPlayers: Record<'first' | 'second', number[]> = {
      first: new Array(correctAnswersPlayer1).fill(0).map((_, i) => i),
      second: new Array(correctAnswersPlayer2).fill(0).map((_, i) => i),
    };

    for (const i of positionQuestion) {
      //@ts-ignore
      const question = gameQuestions[i].question as unknown as Question;
      const answerPlayer1 = correctAnswersForPlayers[
        whoStartFirst === 'first' ? 'first' : 'second'
      ].includes(i)
        ? question.answers[0]
        : 'some answer';

      const answerPlayer2 = correctAnswersForPlayers[
        whoStartFirst === 'first' ? 'second' : 'first'
      ].includes(i)
        ? question.answers[0]
        : 'some answer';

      const [player1Result, player2Result] = await Promise.allSettled([
        await recordCurrentAnswerHandler.execute(
          new RecordCurrentAnswerCommand(firstUserId, answerPlayer1),
        ),
        await recordCurrentAnswerHandler.execute(
          new RecordCurrentAnswerCommand(secondUserId, answerPlayer2),
        ),
      ]);

      expect(player1Result.status).toBe('fulfilled');
      expect(player2Result.status).toBe('fulfilled');
    }

    return {
      gameId: gameId,
    };
  };
}
