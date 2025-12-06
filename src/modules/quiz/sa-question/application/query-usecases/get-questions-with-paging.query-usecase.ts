import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { QuestionViewDto } from '../../api/input-dto/question.view-dto';
import { QuestionQueryParams } from '../../api/input-dto/question-query-params.input-dto';
import { QuestionQueryRepository } from '../../infrastructure/question.query-repository';
import { validateDtoOrFail } from '../../../../../core/validate/validate-dto-or-fail';

export class GetQuestionsWithPagingQuery extends Query<
  PaginatedViewDto<QuestionViewDto[]>
> {
  constructor(public queryParams: QuestionQueryParams) {
    super();
  }
}

@QueryHandler(GetQuestionsWithPagingQuery)
export class GetQuestionsWithPagingHandler
  implements IQueryHandler<GetQuestionsWithPagingQuery>
{
  constructor(protected questionQueryRepository: QuestionQueryRepository) {}

  async execute({
    queryParams,
  }: GetQuestionsWithPagingQuery): Promise<
    PaginatedViewDto<QuestionViewDto[]>
  > {
    await validateDtoOrFail(queryParams);
    return await this.questionQueryRepository.filterQuestionWithPaging(
      queryParams,
    );
  }
}
