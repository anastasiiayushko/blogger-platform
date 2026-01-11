import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
@SkipThrottle()
export class TestingController {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll() {
    const tableNames = this.dataSource.entityMetadatas
      .map((m) => m.tableName)
      .filter((name) => name !== 'migrations')
      .map((name) => `"${name}"`);

    await this.dataSource.query(
      `TRUNCATE TABLE ${tableNames.join(', ')} CASCADE;`,
    );

    return {
      status: true,
    };
  }
}
