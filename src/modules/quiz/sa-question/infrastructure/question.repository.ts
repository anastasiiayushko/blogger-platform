import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Question } from '../domain/question.entity';
import { DomainException } from '../../../../core/exceptions/domain-exception';
import { DomainExceptionCode } from '../../../../core/exceptions/domain-exception-codes';

@Injectable()
export class QuestionRepository {
  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async save(question: Question) {
    await this.questionRepository.save(question);
  }

  async findById(id: string): Promise<Question | null> {
    return await this.questionRepository.findOneBy({ id: id });
  }

  async findOrNotFoundFail(id: string): Promise<Question> {
    const question = await this.questionRepository.findOneBy({ id: id });
    if (!question) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
      });
    }
    return question;
  }

  async softDelete(id: string): Promise<boolean> {
    const result = await this.questionRepository.softDelete({ id: id });
    return !!result.affected;
  }

  async getRandomQuestion(limit = 5): Promise<Question[]> {
    const result = await this.dataSource
      .getRepository(Question)
      .createQueryBuilder('question')
      .orderBy('RANDOM()')
      .limit(limit)
      .getMany();
    return result;
  }
}
