import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  In,
  IsNull,
  Not,
  Repository,
} from 'typeorm';
import { Game } from '../domain/game/game.entity';
import { GameStatusesEnum } from '../domain/game/game-statuses.enum';

@Injectable()
export class GameRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
  ) {}

  private getRepository(em?: EntityManager): Repository<Game> {
    return em ? em.getRepository(Game) : this.gameRepo;
  }

  async findGameInStatusPending(
    excludedUserId: string,
    em?: EntityManager,
  ): Promise<Game | null> {
    const repo = this.getRepository(em);
    return await repo.findOne({
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
      lock: { mode: 'pessimistic_write' },
    });
  }

  async findActiveGameByUserId(
    userId: string,
    em?: EntityManager,
  ): Promise<Game | null> {
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
    em?: EntityManager,
  ): Promise<Game | null> {
    const repo = this.getRepository(em);
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

  async save(game: Game, em?: EntityManager): Promise<void> {
    const repo = this.getRepository(em);
    await repo.save(game);
  }
}
