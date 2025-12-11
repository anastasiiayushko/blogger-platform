import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { Table } from 'typeorm';
import { snakeCase } from 'typeorm/util/StringUtils';

const POSTGRES_NAME_LIMIT = 63;

/**
 * Расширяем стандартную snake-case стратегию, чтобы имена ограничений
 * были детерминированными и совпадали с историческими `FK_<table>_<columns>`.
 */
export class CustomSnakeNamingStrategy extends SnakeNamingStrategy {
  private formatTableName(tableOrName: Table | string): string {
    return snakeCase(this.getTableName(tableOrName));
  }

  private formatColumnSegment(columnNames: string[]): string {
    return columnNames.map((column) => snakeCase(column)).join('_');
  }

  private clampName(name: string): string {
    return name.length > POSTGRES_NAME_LIMIT ? name.slice(0, POSTGRES_NAME_LIMIT) : name;
  }

  foreignKeyName(
    tableOrName: Table | string,
    columnNames: string[],
    referencedTablePath?: string,
    referencedColumnNames?: string[],
  ): string {
    const sortedColumns = [...columnNames].sort();
    const baseName = `FK_${this.formatTableName(tableOrName)}_${this.formatColumnSegment(sortedColumns)}`;
    return this.clampName(baseName);
  }

  uniqueConstraintName(tableOrName: Table | string, columnNames: string[]): string {
    const sortedColumns = [...columnNames].sort();
    const baseName = `UQ_${this.formatTableName(tableOrName)}_${this.formatColumnSegment(sortedColumns)}`;
    return this.clampName(baseName);
  }
}
