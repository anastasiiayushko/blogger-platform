import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { QuestionInputDto } from './input-dto/question.input-dto';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { CreateQuestionCommand } from '../application/usecases/create-question.usecase';
import { QuestionQueryRepository } from '../infrastructure/question.query-repository';
import { QuestionViewDto } from './input-dto/question.view-dto';
import { ApiResponse, ApiTags } from '@nestjs/swagger';
import { QuestionQueryParams } from './input-dto/question-query-params.input-dto';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { UuidValidationPipe } from '../../../../core/pipes/uuid-validation-transform-pipe';
import { TogglePublishQuestionCommand } from '../application/usecases/toggle-publish-question.usecase';
import { PublishInputDto } from './input-dto/publish.input-dto';
import { UpdateQuestionCommand } from '../application/usecases/update-question.usecase';
import { DeleteQuestionCommand } from '../application/usecases/delete-question.usecase';
import { GetQuestionsWithPagingQuery } from '../application/query-usecases/get-questions-with-paging.query-usecase';

@ApiTags('QuizQuestions')
@Controller('sa/quiz/questions')
export class SaQuestionsController {
  constructor(
    protected readonly commandBus: CommandBus,
    protected readonly queryBus: QueryBus,
    protected questionQueryRepository: QuestionQueryRepository,
  ) {}

  @ApiResponse({
    type: PaginatedViewDto<QuestionViewDto[]>,
    status: HttpStatus.OK,
  })
  @Get()
  async questionsWithPaging(@Query() queryParams: QuestionQueryParams) {
    return await this.queryBus.execute(
      new GetQuestionsWithPagingQuery(queryParams),
    );
  }

  @Post()
  async createQuestion(
    @Body() inputDto: QuestionInputDto,
  ): Promise<QuestionViewDto> {
    const cmdResult = await this.commandBus.execute(
      new CreateQuestionCommand(inputDto.body, inputDto.correctAnswers),
    );
    return await this.questionQueryRepository.findOrNotFoundFail(
      cmdResult.questionId,
    );
  }

  @Put(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateQuestion(
    @Param('id', UuidValidationPipe) id: string,
    @Body() inputDto: QuestionInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new UpdateQuestionCommand(id, inputDto.body, inputDto.correctAnswers),
    );
    return;
  }

  @Put('/:id/publish')
  @HttpCode(HttpStatus.NO_CONTENT)
  async togglePublish(
    @Param('id', UuidValidationPipe) id: string,
    @Body() inputDto: PublishInputDto,
  ): Promise<void> {
    await this.commandBus.execute(
      new TogglePublishQuestionCommand(id, inputDto.published),
    );
    return;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteQuestion(
    @Param('id', UuidValidationPipe) id: string,
  ): Promise<void> {
    await this.commandBus.execute(new DeleteQuestionCommand(id));
    return;
  }
}
