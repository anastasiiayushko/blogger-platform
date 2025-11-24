import { MigrationInterface, QueryRunner } from "typeorm";

export class CommonInit1761663854593 implements MigrationInterface {
    name = 'CommonInit1761663854593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "user"
            (
                "id"         uuid                          NOT NULL DEFAULT uuid_generate_v4(),
                "created_at" TIMESTAMP                     NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP                     NOT NULL DEFAULT now(),
                "deleted_at" TIMESTAMP,
                "version"    integer                       NOT NULL DEFAULT '0',
                "login"      character varying COLLATE "C" NOT NULL,
                "email"      character varying COLLATE "C" NOT NULL,
                "password"   character varying             NOT NULL,
                CONSTRAINT "UQ_user_login" UNIQUE ("login"),
                CONSTRAINT "UQ_user_email" UNIQUE ("email"),
                CONSTRAINT "PK_user_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "email_confirmation"
            (
                "id"            uuid      NOT NULL DEFAULT uuid_generate_v4(),
                "created_at"    TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at"    TIMESTAMP NOT NULL DEFAULT now(),
                "deleted_at"    TIMESTAMP,
                "version"       integer   NOT NULL DEFAULT '0',
                "is_confirmed"  boolean   NOT NULL DEFAULT false,
                "code"          uuid      NOT NULL,
                "expiration_at" TIMESTAMP NOT NULL,
                "user_id"       uuid      NOT NULL,
                CONSTRAINT "REL_email_confirmation_user_id" UNIQUE ("user_id"),
                CONSTRAINT "PK_email_confirmation_id" PRIMARY KEY ("id")
            )`);
        await queryRunner.query(`ALTER TABLE "email_confirmation" ADD CONSTRAINT "FK_email_confirmation_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`
            CREATE TABLE "session_device"
            (
                "id"             uuid                     NOT NULL,
                "ip"             character varying        NOT NULL,
                "title"          character varying        NOT NULL DEFAULT 'anonymous',
                "last_active_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "expiration_at"  TIMESTAMP WITH TIME ZONE NOT NULL,
                "created_at"     TIMESTAMP                NOT NULL DEFAULT now(),
                "updated_at"     TIMESTAMP                NOT NULL DEFAULT now(),
                "user_id"        uuid,
                CONSTRAINT "PK_session_device_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "session_device" ADD CONSTRAINT "FK_session_device_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);

        await queryRunner.query(`
            CREATE TABLE "password_recovery"
            (
                "id"            uuid                     NOT NULL DEFAULT uuid_generate_v4(),
                "created_at"    TIMESTAMP                NOT NULL DEFAULT now(),
                "updated_at"    TIMESTAMP                NOT NULL DEFAULT now(),
                "deleted_at"    TIMESTAMP,
                "version"       integer                  NOT NULL DEFAULT '0',
                "code"          uuid                     NOT NULL,
                "expiration_at" TIMESTAMP WITH TIME ZONE NOT NULL,
                "is_confirmed"  boolean                  NOT NULL DEFAULT false,
                "user_id"       uuid,
                CONSTRAINT "REL_password_recovery_user_id" UNIQUE ("user_id"),
                CONSTRAINT "PK_password_recovery_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "password_recovery" ADD CONSTRAINT "FK_password_recovery_user_id" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);


        await queryRunner.query(`
            CREATE TABLE "blog"
            (
                "id"            uuid             NOT NULL DEFAULT uuid_generate_v4(),
                "created_at"    TIMESTAMP        NOT NULL DEFAULT now(),
                "updated_at"    TIMESTAMP        NOT NULL DEFAULT now(),
                "deleted_at"    TIMESTAMP,
                "version"       integer          NOT NULL DEFAULT '0',
                "name"          text COLLATE "C" NOT NULL,
                "description"   text             NOT NULL,
                "website_url"   text             NOT NULL,
                "is_membership" boolean          NOT NULL DEFAULT false,
                CONSTRAINT "PK_blog_id" PRIMARY KEY ("id")
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "post"
            (
                "id"                uuid             NOT NULL DEFAULT uuid_generate_v4(),
                "created_at"        TIMESTAMP        NOT NULL DEFAULT now(),
                "updated_at"        TIMESTAMP        NOT NULL DEFAULT now(),
                "deleted_at"        TIMESTAMP,
                "version"           integer          NOT NULL DEFAULT '0',
                "title"             text COLLATE "C" NOT NULL,
                "short_description" text COLLATE "C" NOT NULL,
                "content"           text COLLATE "C" NOT NULL,
                "blog_id"           uuid             NOT NULL,
                CONSTRAINT "PK_post_id" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_post_blog_id" FOREIGN KEY ("blog_id") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_post_blog_id"`);
        await queryRunner.query(`ALTER TABLE "password_recovery" DROP CONSTRAINT "FK_password_recovery_user_id"`);
        await queryRunner.query(`ALTER TABLE "session_device" DROP CONSTRAINT "FK_session_device_user_id"`);
        await queryRunner.query(`ALTER TABLE "email_confirmation" DROP CONSTRAINT "FK_email_confirmation_user_id"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "blog"`);

        await queryRunner.query(`DROP TABLE "password_recovery"`);
        await queryRunner.query(`DROP TABLE "session_device"`);
        await queryRunner.query(`DROP TABLE "email_confirmation"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
