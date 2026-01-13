import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { Player } from '../domain/player/player.entity';
import { PlayerGameStatusEnum } from '../domain/player/player-game-status.enum';

@Injectable()
export class PlayerRepository {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {}

  private getRepository(em?: EntityManager): Repository<Player> {
    return em ? em.getRepository(Player) : this.playerRepo;
  }

  async findUnfinishedGamePlayer(
    userId: string,
    em?: EntityManager,
  ): Promise<Player | null> {
    const repo = this.getRepository(em);
    return repo.findOne({
      where: {
        userId: userId,
        gameStatus: In([
          PlayerGameStatusEnum.pending,
          PlayerGameStatusEnum.active,
        ]),
      },
      lock: { mode: 'pessimistic_write' },
    });
  }

  async findAllPlayedByUserId(userId: string): Promise<Player[]> {
    return await this.playerRepo.find({
      where: { userId: userId },
    });
  }

  async save(player: Player, em?: EntityManager): Promise<void> {
    const repo = this.getRepository(em);
    await repo.save(player);
  }
}
