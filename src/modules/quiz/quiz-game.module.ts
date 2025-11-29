import { Module } from '@nestjs/common';
import { SaQuestionsController } from './questions/api/sa-questions.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './questions/domain/question.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Question])],
  controllers: [SaQuestionsController],
  providers: [],
  exports: [],
})

export class QuizGameModule {}