import { Controller, Delete, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { SkipThrottle } from '@nestjs/throttler';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Controller('testing')
@SkipThrottle()
export class TestingController {
  constructor(
    @InjectConnection() private readonly databaseConnection: Connection,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  @Delete('all-data')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAll(): Promise<{ status: boolean }> {
    const collections = await this.databaseConnection.listCollections();
    const promises = collections.map((collection) =>
      this.databaseConnection.collection(collection.name).deleteMany({}),
    );
    await Promise.all(promises);

    await this.dataSource.query(`TRUNCATE TABLE public."Users" CASCADE;`);
    await this.dataSource.query(`TRUNCATE TABLE public."Blogs" CASCADE;`);
    return {
      status: true,
    };
  }
}
