import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Repository } from 'typeorm';
import { Game } from '../domain/game/game.entity';
import { GameStatusesEnum } from '../domain/game/game-statuses.enum';

@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}


  async findGameInStatusPending(): Promise<Game | null> {
    return await this.gameRepo.findOne({
      where: {
        status: GameStatusesEnum.pending,
        startGameDate: IsNull(),
      },
    });
  }

  async findUnFinishGameByUser(userId: string): Promise<Game | null> {
    const games = await this.gameRepo.find({
      relations: {
        firstPlayer: true,
        secondPlayer: true,
      },
      where: [
        {
          firstPlayer: { userId: userId },
          status: In([GameStatusesEnum.pending, GameStatusesEnum.active]),
        },
        {
          secondPlayer: { userId: userId },
          status: In([GameStatusesEnum.pending, GameStatusesEnum.active]),
        },
      ],
      take: 1,
    });
    if (games.length === 0) {
      return null;
    }
    return games[0];
  }

  async save(game: Game): Promise<void> {
    await this.gameRepo.save(game);
  }
}
