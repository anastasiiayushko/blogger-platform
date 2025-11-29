import { Column, Entity } from 'typeorm';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { CreateQuestionInputDto } from './dto/create-question.domain-input-dto';

@Entity('questions')
//::TODO нужно ли нормализировать таблицу? Создав отдельную сущность answer и создать покрывающий индекс
// или построить GIN‑индекс на основе answers
export class Question extends BaseOrmEntity {
  @Column({
    type: 'text',
    nullable: false,
  })
  body: string;

  @Column('simple-array')
  answers: string[];

  @Column({
    type: 'boolean',
    default: false,
  })
  published: boolean;

  static createInstance(inputDto: CreateQuestionInputDto): Question {
    const question = new Question();
    question.body = inputDto.body;
    question.answers = inputDto.correctAnswers;
    return question;
  }
}
