import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTablePostImage1785747048786 implements MigrationInterface {
  name = 'CreateTablePostImage1785747048786';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE post_images
                             (
                               "id"         uuid                     NOT NULL DEFAULT uuid_generate_v4(),
                               "object_key" text                     NOT NULL,
                               "mime_type"  text                     NOT NULL,
                               "size"       integer                  NOT NULL,
                               "status"     text                     NOT NULL,
                               "etag"       text,
                               "checksum"   text,
                               "post_id"     uuid                     NOT NULL,
                               "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                               "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                               "version"    INTEGER                  NOT NULL,

                               CONSTRAINT "PK_post_images" PRIMARY KEY ("id")
                             )`);

    await queryRunner.query(
      `ALTER TABLE "post_images"
        ADD CONSTRAINT "FK_post_images_post_id" FOREIGN KEY ("post_id") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "post_images" DROP CONSTRAINT "FK_post_images_post_id"`,
    );

    await queryRunner.query(`drop table "post_images"`);
  }
}
