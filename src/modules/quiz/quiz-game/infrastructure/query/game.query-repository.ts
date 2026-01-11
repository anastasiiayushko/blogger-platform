import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, SelectQueryBuilder } from 'typeorm';
import { Game } from '../../domain/game/game.entity';
import { GameStatusesEnum } from '../../domain/game/game-statuses.enum';
import { GamePairViewDto } from './mapper/game-pair.view-dto';

@Injectable()
export class GameQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  private baseGameQueryBuilder(): SelectQueryBuilder<Game> {
    return this.dataSource
      .getRepository(Game)
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.firstPlayer', 'p1')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p1.answers', 'a1')

      .leftJoinAndSelect('game.secondPlayer', 'p2')
      .leftJoinAndSelect('p2.user', 'u2')
      .leftJoinAndSelect('p2.answers', 'a2')
      .leftJoinAndSelect('game.questions', 'gq', 'gq.game_id = game.id')
      .leftJoinAndSelect('gq.question', 'q');
  }

  async findUnfinishedGameByUserId(
    userId: string,
  ): Promise<GamePairViewDto | null> {
    const game = await this.baseGameQueryBuilder()
      .where('(p1.user_id =:userId or p2.user_id =:userId)', {
        userId,
      })
      .andWhere('game.status In(:...statuses) ', {
        statuses: [GameStatusesEnum.pending, GameStatusesEnum.active],
      })
      .orderBy('game.createdAt', 'DESC')
      .addOrderBy('gq.order', 'ASC')
      .addOrderBy('a1.createdAt', 'ASC')
      .addOrderBy('a2.createdAt', 'ASC')
      .getOne();

    if (!game) {
      return null;
    }
    return GamePairViewDto.mapToView(game);
  }

  async findGameById(id: string): Promise<GamePairViewDto | null> {
    const game = await this.baseGameQueryBuilder()
      .where('game.id = :id', {
        id,
      })
      .orderBy('gq.order', 'ASC')
      .addOrderBy('a1.createdAt', 'ASC')
      .addOrderBy('a2.createdAt', 'ASC')
      .getOne();

    if (!game) {
      return null;
    }
    return GamePairViewDto.mapToView(game);
  }
}
