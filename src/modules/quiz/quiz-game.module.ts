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
import { Game } from './quiz-game/domain/game/game-entity';

const questionsHandler = [
  CreateQuestionHandler,
  TogglePublishQuestionHandler,
  UpdateQuestionHandler,
  DeleteQuestionHandler,
];
const questionQueryHandler = [GetQuestionsWithPagingHandler];

@Module({
  imports: [TypeOrmModule.forFeature([Question, Player, Game]), UserAccountsModule],
  controllers: [SaQuestionsController],

  providers: [
    QuestionRepository,
    QuestionQueryRepository,
    ...questionsHandler,
    ...questionQueryHandler,
  ],
  exports: [],
})
export class QuizGameModule {}
