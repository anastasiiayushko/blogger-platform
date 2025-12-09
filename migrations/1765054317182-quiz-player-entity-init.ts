import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizPlayerEntityInit1765054317182 implements MigrationInterface {
  name = 'QuizPlayerEntityInit1765054317182';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "player"
                             (
                                 "id"         uuid      NOT NULL DEFAULT uuid_generate_v4(),
                                 "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                                 "updated_at" TIMESTAMP          DEFAULT now(),
                                 "deleted_at" TIMESTAMP,
                                 "version"    integer   NOT NULL DEFAULT '0',
                                 "user_id"    uuid      NOT NULL,
                                 "score"      integer   NOT NULL DEFAULT '0',
                                 CONSTRAINT "PK_player_id" PRIMARY KEY ("id")
                             )`);

    await queryRunner.query(`ALTER TABLE "player" ADD CONSTRAINT  positive_score CHECK (score >= 0)`);
    await queryRunner.query(`ALTER TABLE "player"
        ADD CONSTRAINT "FK_player_user_id" FOREIGN KEY ("user_id") REFERENCES "user" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "player" DROP CONSTRAINT positive_score`);

    await queryRunner.query(
      `ALTER TABLE "player" DROP CONSTRAINT "FK_player_user_id", DROP CONSTRAINT "PK_player_id"`,
    );
    await queryRunner.query(`DROP TABLE "player"`);
  }
}
