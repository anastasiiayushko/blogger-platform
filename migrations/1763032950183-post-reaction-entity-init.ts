import { MigrationInterface, QueryRunner } from "typeorm";

export class PostReactionEntityInit1763032950183 implements MigrationInterface {
    name = 'PostReactionEntityInit1763032950183'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "post_reaction"
            (
                "id"         uuid                                 NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP                            NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP                            NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "version"    integer                              NOT NULL DEFAULT '0',
                "status"     "public"."reactions_status_enum" NOT NULL DEFAULT 'None',
                "post_id"    uuid                                 NOT NULL,
                "user_id"    uuid                                 NOT NULL,
                CONSTRAINT "UQ_post_reaction_user_id_post_id" UNIQUE ("user_id", "post_id"),
                CONSTRAINT "PK_post_reaction_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_post_reaction_post_id" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post_reaction" ADD CONSTRAINT "FK_post_reaction_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_post_reaction_user_id"`);
        await queryRunner.query(`ALTER TABLE "post_reaction" DROP CONSTRAINT "FK_post_reaction_post_id"`);
        await queryRunner.query(`DROP TABLE "post_reaction"`);
    }

}
