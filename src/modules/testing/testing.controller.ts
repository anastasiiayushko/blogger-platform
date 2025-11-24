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
  async deleteAll(): Promise<{ status: boolean }> {
    // const collections = await this.databaseConnection.listCollections();
    // const promises = collections.map((collection) =>
    //   this.databaseConnection.collection(collection.name).deleteMany({}),
    // );
    // await Promise.all(promises);

    // await this.dataSource.query(`TRUNCATE TABLE public."Blogs" CASCADE;`);
    // await this.dataSource.query(`TRUNCATE TABLE public."Posts" CASCADE;`);
    // await this.dataSource.query(`TRUNCATE TABLE public."Comments" CASCADE;`);
    await this.dataSource.query(
      `TRUNCATE TABLE public."comment_reaction" CASCADE;`,
    );
    // await this.dataSource.query(
    //   `TRUNCATE TABLE public."PostReactions" CASCADE;`,
    // );

    await this.dataSource.query(
      `TRUNCATE TABLE public.post CASCADE;`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public.blog CASCADE;`,
    );
    await this.dataSource.query(
      `TRUNCATE TABLE public.email_confirmation CASCADE;`,
    );
    await this.dataSource.query(`TRUNCATE TABLE public."user" CASCADE;`);

    return {
      status: true,
    };
  }
}
