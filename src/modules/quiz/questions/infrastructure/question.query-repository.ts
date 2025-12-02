import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { QuestionViewDto } from '../api/input-dto/question.view-dto';
import {
  QuestionPublishStatusEnum,
  QuestionQueryParams,
  QuestionSortByEnum,
} from '../api/input-dto/question-query-params.input-dto';
import { InjectDataSource } from '@nestjs/typeorm';
import { Question } from '../domain/question.entity';
import { toTypeOrmOrderDir } from '../../../../core/utils/sort/to-type-orm-order-dir';
import { PaginatedViewDto } from '../../../../core/dto/base.paginated.view-dto';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

export type QuestionRowRaw = {
  id: string;
  body: string;
  answers: string[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class QuestionQueryRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  private commonSelectQuestionBuilder() {
    return this.dataSource
      .getRepository(Question)
      .createQueryBuilder('q')
      .select([
        'q.id as id',
        'q.body as body',
        'q.answers as answers',
        'q.published as published',
        'q.created_at as "createdAt"',
        'q.updated_at as "updatedAt"',
      ]);
  }

  async findById(id: string): Promise<QuestionViewDto | null> {
    const question = await this.commonSelectQuestionBuilder()
      .where('q.id=:id', {
        id: id,
      })
      .getRawOne<QuestionRowRaw>();
    if (!question) {
      return null;
    }
    return QuestionViewDto.mapToView(question);
  }

  //
  async findOrNotFoundFail(id: string): Promise<QuestionViewDto> {
    const question = await this.commonSelectQuestionBuilder()
      .where('q.id=:id', {
        id: id,
      })
      .getRawOne<QuestionRowRaw>();
    if (!question) {
      throw new DomainException({ code: DomainExceptionCode.NotFound });
    }
    return QuestionViewDto.mapToView(question);
  }

  async filterQuestionWithPaging(
    queryParams: QuestionQueryParams,
  ): Promise<PaginatedViewDto<QuestionViewDto[]>> {
    type PublishedStatusKeys =
      | QuestionPublishStatusEnum.notPublished
      | QuestionPublishStatusEnum.published;
    const PUBLISHED_STATUS_CONDITION_MAP: Record<PublishedStatusKeys, string> =
      {
        ['published']: 'published IS TRUE',
        ['notPublished']: 'published IS FALSE',
      };

    const SORT_BY_FIELD_MAP: Record<QuestionSortByEnum, string> = {
      ['createdAt']: 'created_at',
      ['updatedAt']: 'updated_at',
    };

    const whereCondition: string[] = [];
    const filterParam: any = {};
    if (queryParams.bodySearchTerm) {
      whereCondition.push('body ILIKE :bodySearchTerm');
      filterParam.bodySearchTerm = `%${queryParams?.bodySearchTerm ?? ''}%`;
    }
    if (PUBLISHED_STATUS_CONDITION_MAP[queryParams.publishedStatus]) {
      whereCondition.push(
        PUBLISHED_STATUS_CONDITION_MAP[queryParams.publishedStatus],
      );
    }

    const orderDir = toTypeOrmOrderDir(queryParams.sortDirection);
    const orderName = SORT_BY_FIELD_MAP[queryParams?.sortBy];

    const qrBuilder = this.commonSelectQuestionBuilder();

    qrBuilder.where(whereCondition.join(' AND '), filterParam);

    const totalCount = await qrBuilder.getCount();

    const questions = await qrBuilder
      .orderBy({
        [orderName]: orderDir,
      })
      .limit(queryParams.pageSize)
      .offset(queryParams.calculateSkip())
      .getRawMany<QuestionRowRaw>();

    return PaginatedViewDto.mapToView({
      page: queryParams.pageNumber,
      size: queryParams.pageSize,
      items: questions.map((i) => QuestionViewDto.mapToView(i)),
      totalCount: totalCount,
    });
  }
}
