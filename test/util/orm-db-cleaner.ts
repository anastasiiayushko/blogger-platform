import { DataSource } from 'typeorm';

export async function ormDBCleaner(dataSource: DataSource) {
  const entities = dataSource.entityMetadatas;

  const tableNames = entities
    .map((entity) => `"${entity.tableName}"`) // с кавычками на всякий случай
    .join(', ');

  if (!tableNames.length) return;

  // Отключаем FK, чистим таблицы, включаем обратно
  await dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
}