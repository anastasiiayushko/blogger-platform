import { MigrationInterface, QueryRunner } from 'typeorm';

export class GameStatisticInit1768490924973 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "game_statistic"
                             (
                                 "id"          uuid        NOT NULL DEFAULT uuid_generate_v4(),
                                 "user_id"     uuid UNIQUE NOT NULL,
                                 "sum_score"   INTEGER CHECK ( sum_score >= 0 ),
                                 "avg_score"   NUMERIC(10, 2) CHECK ( avg_score >= 0 ),
                                 "game_count"  INTEGER CHECK ( game_count >= 0 ),
                                 "wins_count"  INTEGER CHECK ( wins_count >= 0 ),
                                 "losses_count" INTEGER CHECK ( losses_count >= 0 ),
                                 "draws_count" INTEGER CHECK ( draws_count >= 0 ),

                                 "created_at"  TIMESTAMP   NOT NULL DEFAULT now(),
                                 "updated_at"  TIMESTAMP   NOT NULL DEFAULT now(),
                                 "deleted_at"  TIMESTAMP,
                                 "version"     integer     NOT NULL DEFAULT '0',

                                 PRIMARY KEY ("id"),
                                 FOREIGN KEY ("user_id") REFERENCES "user" ("id")

                             )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "game_statistic"`);
  }
}
