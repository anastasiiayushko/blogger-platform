import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Player } from '../domain/player/player.entity';

@Injectable()
export class PlayerRepository {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepo: Repository<Player>,
  ) {}

  async findAllPlayedByUserId(userId: string): Promise<Player[]> {
    return await this.playerRepo.find({
      where: { userId: userId },
    });
  }

  async save(player: Player): Promise<void> {
    await this.playerRepo.save(player);
  }
}
