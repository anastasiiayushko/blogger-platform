import { Question } from '../src/modules/quiz/sa-question/domain/question.entity';
import { DataSource } from 'typeorm';

export class FillQuestionsSeed {
  static async up(dataSource: DataSource): Promise<void> {
    const items = [
      {
        body: 'Столица Франции?',
        answers: ['париж'],
        published: true,
      },
      {
        body: 'Какая планета считается самой большой в Солнечной системе?',
        answers: ['юпитер'],
        published: true,
      },
      {
        body: 'Сколько дней в високосном году?',
        answers: ['366'],
        published: true,
      },
      {
        body: 'Кто написал пьесу «Гамлет»?',
        answers: ['уильям шекспир', 'шекспир'],
        published: true,
      },
      {
        body: 'Как называется самый большой океан на Земле?',
        answers: ['тихий океан', 'тихий'],
        published: true,
      },
      {
        body: 'Какая страна является родиной пиццы?',
        answers: ['италия'],
        published: true,
      },
      {
        body: 'Как называется прибор для измерения температуры?',
        answers: ['термометр'],
        published: true,
      },
      {
        body: 'Сколько континентов существует на Земле?',
        answers: ['7', 'семь'],
        published: true,
      },
      {
        body: 'Какой газ преобладает в атмосфере Земли?',
        answers: ['азот'],
        published: true,
      },
      {
        body: 'Сколько градусов в прямом угле?',
        answers: ['90', 'девяносто'],
        published: true,
      },
      {
        body: 'Какая самая высокая гора в мире?',
        answers: ['эверест', 'джомолунгма'],
        published: true,
      },
      {
        body: 'Кто изобрёл теорию относительности?',
        answers: ['альберт эйнштейн', 'эйнштейн'],
        published: true,
      },
      {
        body: 'Как называется процесс превращения воды в пар?',
        answers: ['испарение'],
        published: true,
      },
      {
        body: 'Сколько хромосом у человека?',
        answers: ['46'],
        published: true,
      },
      {
        body: 'Как называется самая большая пустыня в мире?',
        answers: ['сахара'],
        published: true,
      },
      {
        body: 'Кто является автором картины «Звёздная ночь»?',
        answers: ['винсент ван гог', 'ван гог'],
        published: true,
      },
      {
        body: 'Какая валюта используется в Японии?',
        answers: ['иена'],
        published: true,
      },
      {
        body: 'Сколько океанов существует?',
        answers: ['5', 'пять'],
        published: true,
      },
      {
        body: 'Какой металл является самым лёгким?',
        answers: ['литий'],
        published: true,
      },
      {
        body: 'Как называется самая длинная река в мире?',
        answers: ['амазонка'],
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
