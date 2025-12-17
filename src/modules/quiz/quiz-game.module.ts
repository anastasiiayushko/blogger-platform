import { Module } from '@nestjs/common';
import { SaQuestionsController } from './sa-question/api/sa-questions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './sa-question/domain/question.entity';
import { QuestionRepository } from './sa-question/infrastructure/question.repository';
import { CreateQuestionHandler } from './sa-question/application/usecases/create-question.usecase';
import { QuestionQueryRepository } from './sa-question/infrastructure/question.query-repository';
import { TogglePublishQuestionHandler } from './sa-question/application/usecases/toggle-publish-question.usecase';
import { UpdateQuestionHandler } from './sa-question/application/usecases/update-question.usecase';
import { DeleteQuestionHandler } from './sa-question/application/usecases/delete-question.usecase';
import { GetQuestionsWithPagingHandler } from './sa-question/application/query-usecases/get-questions-with-paging.query-usecase';
import { UserAccountsModule } from '../user-accounts/user-accounts.module';
import { Player } from './quiz-game/domain/player/player.entity';
import { Game } from './quiz-game/domain/game/game.entity';
import { GameQuestion } from './quiz-game/domain/game-question/game-question.entity';
import { Answer } from './quiz-game/domain/answer/answer.entity';
import { PlayerRepository } from './quiz-game/infrastructure/player.repository';
import { GameRepository } from './quiz-game/infrastructure/game.repository';
import { GamePairConnectionHandler } from './quiz-game/features/pair-game/application/usecases/game-pair-connection.usecese';
import { GameQueryRepository } from './quiz-game/infrastructure/query/game.query-repository';
import { PairGameController } from './quiz-game/features/pair-game/api/pair-game.controller';
import { GetUnfinishedGameQueryHandler } from './quiz-game/features/pair-game/application/query-useceses/get-unfinished-game.query-usecase';
import { GetGameByIdHandler } from './quiz-game/features/pair-game/application/query-useceses/get-game-by-id.query-usecase';
import {
  RecordCurrentAnswerHandler
} from './quiz-game/features/pair-game/application/usecases/record-current-answer.usecese';

const questionsHandler = [
  CreateQuestionHandler,
  TogglePublishQuestionHandler,
  UpdateQuestionHandler,
  DeleteQuestionHandler,
];
const pairGameHandler = [GamePairConnectionHandler, RecordCurrentAnswerHandler];
const questionQueryHandler = [GetQuestionsWithPagingHandler];
const pairGameQueryHandler = [
  GetUnfinishedGameQueryHandler,
  GetGameByIdHandler,
];

@Module({
  imports: [
    TypeOrmModule.forFeature([Question, Player, Game, GameQuestion, Answer]),
    UserAccountsModule,
  ],
  controllers: [SaQuestionsController, PairGameController],

  providers: [
    QuestionRepository,
    QuestionQueryRepository,
    PlayerRepository,
    GameRepository,
    GameQueryRepository,
    ...questionsHandler,
    ...questionQueryHandler,
    ...pairGameHandler,
    ...pairGameQueryHandler,
  ],
  exports: [],
})
export class QuizGameModule {}
