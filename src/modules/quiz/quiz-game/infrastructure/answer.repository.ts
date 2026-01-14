import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Answer } from '../domain/answer/answer.entity';

@Injectable()
export class AnswerRepository {
  constructor(
    @InjectRepository(Answer)
    private readonly answerRepository: Repository<Answer>,
  ) {}

  private getRepository(em?: EntityManager) {
    return em ? em.getRepository(Answer) : this.answerRepository;
  }

  async save(answer: Answer, em?: EntityManager): Promise<void> {
    const repo = this.getRepository(em);
    await repo.save(answer);
  }
}
