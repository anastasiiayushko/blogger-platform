import { Module } from '@nestjs/common';
import { SaQuestionsController } from './questions/api/sa-questions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './questions/domain/question.entity';
import { QuestionRepository } from './questions/infrastructure/question.repository';
import { CreateQuestionHandler } from './questions/application/usecases/create-question.usecase';
import { QuestionQueryRepository } from './questions/infrastructure/question.query-repository';
import { TogglePublishQuestionHandler } from './questions/application/usecases/toggle-publish-question.usecase';
import { UpdateQuestionHandler } from './questions/application/usecases/update-question.usecase';
import { DeleteQuestionHandler } from './questions/application/usecases/delete-question.usecase';

const questionsHandler = [
  CreateQuestionHandler,
  TogglePublishQuestionHandler,
  UpdateQuestionHandler,
  DeleteQuestionHandler
];

@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  controllers: [SaQuestionsController],

  providers: [QuestionRepository, QuestionQueryRepository, ...questionsHandler],
  exports: [],
})
export class QuizGameModule {}
