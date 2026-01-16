import { Injectable } from '@nestjs/common';
import { GameStatisticRepository } from '../../../../infrastructure/game-statistic.repository';
import { Game } from '../../../../domain/game/game.entity';
import { EntityManager } from 'typeorm';
import { GameStatusesEnum } from '../../../../domain/game/game-statuses.enum';
import { GameStatistic } from '../../../../domain/game-statistic/game-statistic.entity';
import { Player } from '../../../../domain/player/player.entity';

@Injectable()
export class GameStatisticService {
  constructor(protected gameStatisticRepository: GameStatisticRepository) {}

  async recalculateAndSaveGameStatistic(game: Game, em: EntityManager) {
    if (game.status !== GameStatusesEnum.finished) return;

    const firstUserId = game.firstPlayer.userId;
    const secondUserId = game.secondPlayer!.userId;
    const statFirstPlayer = await this.createStatisticForUserIfNotExist(
      firstUserId,
      em,
    );
    const statSecondPlayer = await this.createStatisticForUserIfNotExist(
      secondUserId,
      em,
    );
    const result1 = statFirstPlayer.prepareDataByPlayer(game.firstPlayer);
    const result2 = statSecondPlayer!.prepareDataByPlayer(
      game!.secondPlayer as Player,
    );
    await this.gameStatisticRepository.setStatistic(result1, em);
    await this.gameStatisticRepository.setStatistic(result2, em);
  }

  async createStatisticForUserIfNotExist(
    userId: string,
    em: EntityManager,
  ): Promise<GameStatistic> {
    await this.gameStatisticRepository.createIfNotExists(userId, em);

    const exist = await this.gameStatisticRepository.findByUserId(userId, em);
    if (!exist) {
      throw new Error(`GameStatistic not found for userId: ${userId}`);
    }

    return exist;
  }
}
