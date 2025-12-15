import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Game } from '../../domain/game/game.entity';
import { GameStatusesEnum } from '../../domain/game/game-statuses.enum';
import { GamePairViewDto } from './mapper/game-pair.view-dto';

@Injectable()
export class GameQueryRepository {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findUnfinishedGameByUserId(
    userId: string,
  ): Promise<GamePairViewDto | null> {
    const game = await this.dataSource
      .getRepository(Game)
      .createQueryBuilder('game')
      .leftJoinAndSelect('game.firstPlayer', 'p1')
      .leftJoinAndSelect('p1.user', 'u1')
      .leftJoinAndSelect('p1.answers', 'a1')
      .leftJoinAndSelect('game.secondPlayer', 'p2')
      .leftJoinAndSelect('p2.user', 'u2')
      .leftJoinAndSelect('p2.answers', 'a2')
      .leftJoinAndSelect('game.questions', 'gq', 'gq.game_id = game.id')
      .leftJoinAndSelect('gq.question', 'question')
      .orderBy('gq.order', 'ASC')
      // .leftJoinAndSelect('gq.question_id', 'q')
      .where('(p1.user_id =:userId or p2.user_id =:userId)', {
        userId,
      })
      .andWhere('game.status In(:...statuses) ', {
        statuses: [GameStatusesEnum.pending, GameStatusesEnum.active],
      })
      .getOne();

    console.log('result game ->', game);
    if (!game) {
      return null;
    }
    return GamePairViewDto.mapToView(game);
  }
}
