import { Column, Entity } from 'typeorm';
import { BaseOrmEntity } from '../../../../core/base-orm-entity/base-orm-entity';
import { UpSertQuestionInputDto } from './dto/up-sert-question-input.dto';

@Entity('questions')
//::TODO нужно ли нормализировать таблицу? Создав отдельную сущность answer и создать покрывающий индекс
export class Question extends BaseOrmEntity {
  @Column({
    type: 'text',
    nullable: false,
    collation: 'C',
  })
  body: string;

  @Column({ array: true, nullable: false, type: 'varchar' })
  answers: string[];

  @Column({
    type: 'boolean',
    default: false,
  })
  published: boolean;

  static createInstance(inputDto: UpSertQuestionInputDto): Question {
    const question = new Question();
    question.validateBody(inputDto.body);
    question.body = inputDto.body;
    question.published = false;
    question.addAnswers(inputDto.correctAnswers);
    return question;
  }

  private validateBody(body: string) {
    if (!body.trim().length) {
      throw new Error('Body questions must be empty');
    }
  }

  updateQuestion(inputDto: UpSertQuestionInputDto) {
    this.validateBody(inputDto.body);
    this.body = inputDto.body;
    this.addAnswers(inputDto.correctAnswers);
  }

  addAnswers(answers: string[]) {
    if (!Array.isArray(answers) || !answers?.length) {
      throw new Error(`Answers must be an array strings`);
    }
    const lowers = answers
      .map((x) => x?.toLowerCase()?.trim())
      .filter((x) => !!x);
    const uniqueAnswers = new Set<string>(lowers);
    this.answers = Array.from(uniqueAnswers);
  }

  togglePublished(published: boolean) {
    if (published === this.published) {
      return;
    }
    this.published = published;
  }
}
