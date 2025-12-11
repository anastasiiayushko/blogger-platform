import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, IsNull, Repository } from 'typeorm';
import { Game } from '../domain/game/game.entity';
import { GameStatusesEnum } from '../domain/game/game-statuses.enum';
import { Question } from '../../sa-question/domain/question.entity';
import { GameQuestion } from '../domain/game-question/game-question.entity';
import { QuestionRepository } from '../../sa-question/infrastructure/question.repository';
import { GameRepository } from './game.repository';

@Injectable()
export class GameQuestionRepository {
  constructor(
    @InjectRepository(Game)
    private readonly gameRepo: Repository<Game>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(GameQuestion)
    private readonly gameQuestionRepository: Repository<GameQuestion>,
  ) {}



  async save(gameQ: GameQuestion): Promise<void> {
    await this.gameRepo.save(gameQ);
  }
}
