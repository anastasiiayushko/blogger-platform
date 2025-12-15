import { MigrationInterface, QueryRunner } from 'typeorm';

export class QuizGameEntityInit1765055604413 implements MigrationInterface {
  name = 'QuizGameEntityInit1765055604413';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE "game"
                             (
                                 "id"                uuid               NOT NULL DEFAULT uuid_generate_v4(),
                                 "created_at"        TIMESTAMP          NOT NULL DEFAULT now(),
                                 "updated_at"        TIMESTAMP                   DEFAULT now(),
                                 "deleted_at"        TIMESTAMP,
                                 "version"           integer            NOT NULL DEFAULT '0',
                                 "status"            quiz_game_statuses NOT NULL DEFAULT 'PendingSecondPlayer',
--                                  "pair_created_date" TIMESTAMP          NOT NULL DEFAULT now(),
                                 "start_game_date"   TIMESTAMP                   DEFAULT NULL,
                                 "finish_game_date"  TIMESTAMP                   DEFAULT NULL,
                                 "first_player_id"   uuid               NOT NULL,
                                 "second_player_id"  uuid                        DEFAULT NULL,
                                 CONSTRAINT "PK_game_id" PRIMARY KEY ("id")

                             )`);
    await queryRunner.query(`
        ALTER TABLE "game"
            ADD CONSTRAINT "FK_game_first_player_id" FOREIGN KEY ("first_player_id") REFERENCES "player" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION,
            ADD CONSTRAINT "FK_game_second_player_id" FOREIGN KEY ("second_player_id") REFERENCES "player" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
        ALTER TABLE "game"
        DROP
        CONSTRAINT "PK_game_id",
        DROP
        CONSTRAINT "FK_game_first_player_id" ,
        DROP
        CONSTRAINT "FK_game_second_player_id"
    `);

    await queryRunner.query(`DROP TABLE "game"`);

  }
}
