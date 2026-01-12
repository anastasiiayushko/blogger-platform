import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Not, Repository } from 'typeorm';
import { Game } from '../domain/game/game.entity';
import { GameStatusesEnum } from '../domain/game/game-statuses.enum';

@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}

  async findGameInStatusPending(excludedUserId: string): Promise<Game | null> {
    return await this.gameRepo.findOne({
      relations: {
        questions: true,
        firstPlayer: true,
      },
      where: {
        status: GameStatusesEnum.pending,
        startGameDate: IsNull(),
        ...(excludedUserId
          ? { firstPlayer: { userId: Not(excludedUserId) } }
          : {}),
      },
    });
  }

  async findActiveGameByUserId(userId: string): Promise<Game | null> {
    return await this.gameRepo.findOne({
      relations: {
        firstPlayer: {
          answers: true,
        },
        secondPlayer: {
          answers: true,
        },
        questions: {
          question: true,
        },
      },
      where: [
        {
          firstPlayer: { userId: userId },
          status: GameStatusesEnum.active,
        },
        {
          secondPlayer: { userId: userId },
          status: GameStatusesEnum.active,
        },
      ],
      order: {
        createdAt: 'DESC',
        questions: {
          order: 'ASC',
        },
        firstPlayer: {
          answers: { createdAt: 'ASC' },
        },
        secondPlayer: {
          answers: { createdAt: 'ASC' },
        },
      },
    });
  }

  async findUnFinishGameByUser(
    userId: string,
    em?: DataSource,
  ): Promise<Game | null> {
    const repo = em ? em.getRepository(Game) : this.gameRepo;
    const games = await repo.find({
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
      order: { createdAt: 'DESC' },
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
