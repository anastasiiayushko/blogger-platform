import { Question } from '../src/modules/quiz/sa-question/domain/question.entity';
import { DataSource } from 'typeorm';

export class FillQuestionsSeed {
  static async up(dataSource: DataSource): Promise<void> {
    const items = [
      {
        body: 'Столица Франции?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Какая планета считается самой большой в Солнечной системе?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Сколько дней в високосном году?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Кто написал пьесу «Гамлет»?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Как называется самый большой океан на Земле?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Какая страна является родиной пиццы?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Как называется прибор для измерения температуры?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Сколько континентов существует на Земле?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Какой газ преобладает в атмосфере Земли?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Сколько градусов в прямом угле?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Какая самая высокая гора в мире?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Кто изобрёл теорию относительности?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Как называется процесс превращения воды в пар?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Сколько хромосом у человека?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Как называется самая большая пустыня в мире?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Кто является автором картины «Звёздная ночь»?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Какая валюта используется в Японии?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Сколько океанов существует?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Какой металл является самым лёгким?',
        answers: ['correct'],
        published: true,
      },
      {
        body: 'Как называется самая длинная река в мире?',
        answers: ['correct'],
        published: true,
      },
    ];
    await dataSource
      .getRepository(Question)
      .createQueryBuilder()
      .insert()
      .values(items)
      .execute();
  }
}
