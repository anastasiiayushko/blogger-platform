import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, EntityManager, In, Repository } from 'typeorm';
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
    const qb = repo
      .createQueryBuilder('game')
      .innerJoinAndSelect('game.firstPlayer', 'firstPlayer')
      .where('game.status = :status', { status: GameStatusesEnum.pending })
      .andWhere('game.startGameDate IS NULL')
      .setLock('pessimistic_write', undefined, ['game']);

    if (excludedUserId) {
      qb.andWhere('firstPlayer.userId != :excludedUserId', { excludedUserId });
    }

    return await qb.getOne();
  }

  async findActiveGameByUserId(
    userId: string,
    em?: EntityManager,
  ): Promise<Game | null> {
    const repo = this.getRepository(em);
    if (!em) {
      return await repo.findOne({
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

    return await repo
      .createQueryBuilder('game')
      .innerJoinAndSelect('game.firstPlayer', 'firstplayer')
      .leftJoinAndSelect('firstplayer.answers', 'firstplayeranswers')
      .innerJoinAndSelect('game.secondPlayer', 'secondplayer')
      .leftJoinAndSelect('secondplayer.answers', 'secondplayeranswers')
      .leftJoinAndSelect('game.questions', 'questions')
      .leftJoinAndSelect('questions.question', 'question')
      .where('game.status = :status', { status: GameStatusesEnum.active })
      .andWhere(
        new Brackets((qb) => {
          qb.where('firstplayer.userId = :userId', { userId }).orWhere(
            'secondplayer.userId = :userId',
            { userId },
          );
        }),
      )
      // .orderBy('game.createdAt', 'DESC')
      .addOrderBy('questions.order', 'ASC')
      .addOrderBy('firstplayeranswers.createdAt', 'ASC')
      .addOrderBy('secondplayeranswers.createdAt', 'ASC')
      .setLock('pessimistic_write', undefined, [
        'game',
        'firstplayer',
        'secondplayer',
      ])
      .getOne();
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
