import { Injectable } from '@nestjs/common';
import {
  GetPostQueryParams,
  PostQuerySortByEnum,
} from '../../api/input-dto/get-post-query-params.input-dto';
import { GetPostFilterContextInputDTO } from './dto/get-post-filter-context-input-dto';
import { PaginatedViewDto } from '../../../../../core/dto/base.paginated.view-dto';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Post } from '../../domain/post.entity';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { PostViewDTO } from '../../api/view-dto/post.view-dto';
import { DomainException } from '../../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../../core/exceptions/domain-exception-codes';
import { toTypeOrmOrderDir } from '../../../../../core/utils/sort/to-type-orm-order-dir';
import { PostReaction } from '../../domain/post-reactions.entity';
import { LikeStatusEnum } from '../../../../../core/types/like-status.enum';

interface NewestLikeView {
  addedAt: string;
  userId: string;
  login: string;
}

export class PostWithNewestLikesRaw {
  id: string;
  title: string;
  short_description: string;
  content: string;
  created_at: string;
  blog_name: string;
  blog_id: string;
  likes_count: number;
  dislikes_count: number;
  my_status: LikeStatusEnum;
  newest_likes: NewestLikeView[];
}

@Injectable()
export class PostQueryRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectRepository(Post) protected postRepository: Repository<Post>,
  ) {}

  private newestLikesSubQuery() {
    // create driver table last 3 likes
    const lastLikeSubQuery = this.dataSource
      .createQueryBuilder()
      .subQuery()
      .from(PostReaction, 'nl')
      .select([
        `nl.post_id`,
        `nl.user_id`,
        `nl.created_at`,
        `ROW_NUMBER() OVER (PARTITION BY post_id ORDER BY created_at DESC) AS item`,
      ])
      .where('status = :like')
      .setParameters({ like: LikeStatusEnum.Like });

    return this.dataSource
      .createQueryBuilder()
      .subQuery()
      .from(`(${lastLikeSubQuery.getQuery()})`, 'lk')
      .setParameters(lastLikeSubQuery.getParameters())
      .leftJoin('user', 'u', 'u.id=lk.user_id')
      .where('lk.item BETWEEN 1 AND 3')
      .select([
        'lk.post_id AS post_id',
        `json_agg(
        json_build_object(
          'addedAt', lk.created_at,
          'userId', lk.user_id,
          'login', u.login
        )
        ORDER BY lk.created_at DESC
     ) AS newest_likes`,
      ])
      .groupBy('lk.post_id');
  }

  private postReactionSubQuery(userId: string | null = null) {
    return this.dataSource
      .createQueryBuilder()
      .subQuery()
      .from(PostReaction, 'pr')
      .select([
        `pr.post_id`,
        `COUNT(*) FILTER(WHERE pr.status = :like) AS like_count`,
        `COUNT(*) FILTER(WHERE pr.status = :dislike) AS dislike_count`,
        `MAX(pr.status) FILTER(WHERE pr.user_id = :user_id) AS my_status`,
      ])
      .groupBy('pr.post_id')
      .setParameters({
        like: LikeStatusEnum.Like,
        dislike: LikeStatusEnum.Dislike,
        user_id: userId,
      });
  }
  /**
   * собирает единый SQL‑билдер для
   *   выборки постов вместе с блогом, агрегированными лайками/
   *   дизлайками и массивом последних трёх лайков. Он:
   *
   *   - принимает userId, чтобы подзапрос likes умел вернуть
   *     my_status для конкретного пользователя (или None, если
   *     userId не передан);
   *   - создаёт два подзапроса: postReactionSubQuery (лайки/
   *     дизлайки + статус пользователя) и newestLikesSubQuery
   *     (топ‑3 свежих лайков в JSON);
   *   - строит основной query builder от таблицы Post c join’ом
   *     на Blog, подцепляет оба подзапроса через LEFT JOIN по
   *     post_id;
   *   - выбирает «сырые» колонки поста и блога (p.id, p.title,
   *     b.name и т.д.) плюс добавляет агрегаты (likes_count,
   *     dislikes_count, my_status, newest_likes).
   *
   *   Этот метод не выполняет запрос, а возвращает
   *   SelectQueryBuilder, чтобы дальше (в getByIdOrNotFoundFail,
   *   getAll и т.п.) можно было навешивать where,
   *   orderBy, пагинацию и вызывать getRaw*, но при этом
   *   гарантировать, что набор полей всегда одинаковый
   *   (PostWithNewestLikesRaw).
   * */
  private basePostQueryBuilder(
    userId: string | null = null,
  ): SelectQueryBuilder<Post> {
    const postReactionSubQuery = this.postReactionSubQuery(userId);
    const newestLikesSubQuery = this.newestLikesSubQuery();

    return this.dataSource
      .createQueryBuilder(Post, 'p')
      .innerJoin('blog', 'b', 'b.id = p.blog_id')
      .leftJoin(
        `(${postReactionSubQuery.getQuery()})`,
        'pr',
        'pr.post_id = p.id',
      )
      .setParameters(postReactionSubQuery.getParameters())
      .leftJoin(
        `(${newestLikesSubQuery.getQuery()})`,
        'nl',
        'nl.post_id = p.id',
      )
      .setParameters(newestLikesSubQuery.getParameters())
      .select([
        `p.id as id`,
        `p.title as title`,
        `p.short_description as short_description`,
        `p.content as content`,
        `p.created_at as created_at`,
        `b.name as blog_name`,
        `b.id as blog_id`,
      ])
      .addSelect([
        `CAST(COALESCE(pr.like_count, 0) AS INT) as likes_count`,
        `CAST(COALESCE(pr.dislike_count, 0) AS INT) as dislikes_count`,
        `COALESCE(pr.my_status, 'None') as my_status`,
        `COALESCE(nl.newest_likes, '[]') AS newest_likes`,
      ]);
  }

  async getByIdOrNotFoundFail(
    id: string,
    userId: string | null = null,
  ): Promise<PostViewDTO> {
    const baseQueryBuilder = this.basePostQueryBuilder(userId);
    const post = await baseQueryBuilder
      .where(`p.id = :post_id`, { post_id: id })
      .getRawOne<PostWithNewestLikesRaw>();

    if (!post) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    return PostViewDTO.mapToView(post);
  }

  async getAll(
    query: GetPostQueryParams,
    filterContext: GetPostFilterContextInputDTO | null = null,
    userId: string | null = null,
  ): Promise<PaginatedViewDto<PostViewDTO[]>> {
    const POST_SORT_COLUMN_MAP: Record<PostQuerySortByEnum, string> = {
      [PostQuerySortByEnum.createAt]: 'p.created_at',
      [PostQuerySortByEnum.blogName]: 'b.name',
      [PostQuerySortByEnum.content]: 'p.content',
      [PostQuerySortByEnum.shortDescription]: 'p.short_description',
      [PostQuerySortByEnum.title]: 'p.title',
    };

    const orderByColumn =
      POST_SORT_COLUMN_MAP[query.sortBy] ??
      POST_SORT_COLUMN_MAP[PostQuerySortByEnum.createAt];

    const sortDirection = toTypeOrmOrderDir(query.sortDirection);

    const baseQueryBuilder = this.basePostQueryBuilder(userId);
    if (filterContext?.blogId) {
      baseQueryBuilder.where('p.blog_id =:blog_id', {
        blog_id: filterContext?.blogId,
      });
    }

    const totalCount = await baseQueryBuilder.clone().getCount();

    const posts = await baseQueryBuilder
      .orderBy(orderByColumn, sortDirection)
      .offset(query.calculateSkip())
      .limit(query.pageSize)
      .getRawMany<PostWithNewestLikesRaw>();

    return PaginatedViewDto.mapToView({
      items: posts.map((p) => PostViewDTO.mapToView(p)),
      page: query.pageNumber,
      totalCount: totalCount,
      size: query.pageSize,
    });
  }
}

