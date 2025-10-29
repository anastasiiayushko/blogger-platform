import { MigrationInterface, QueryRunner } from "typeorm";

export class CommonInit1761663854593 implements MigrationInterface {
    name = 'CommonInit1761663854593'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "email_confirmation" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '0', "is_confirmed" boolean NOT NULL DEFAULT false, "code" uuid NOT NULL, "expiration_at" TIMESTAMP NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "REL_857e9c1f08bc0a9f5010162183" UNIQUE ("user_id"), CONSTRAINT "PK_ff2b80a46c3992a0046b07c5456" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "session_device" ("id" uuid NOT NULL, "ip" character varying NOT NULL, "title" character varying NOT NULL DEFAULT 'anonymous', "last_active_at" TIMESTAMP WITH TIME ZONE NOT NULL, "expiration_at" TIMESTAMP WITH TIME ZONE NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "user_id" uuid, CONSTRAINT "PK_0439eebad5445f7def6a9dd50d7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "password_recovery" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '0', "code" uuid NOT NULL, "expiration_at" TIMESTAMP WITH TIME ZONE NOT NULL, "is_confirmed" boolean NOT NULL DEFAULT false, "user_id" uuid, CONSTRAINT "REL_d150be562deac1f539cc4b59fc" UNIQUE ("user_id"), CONSTRAINT "PK_104b7650227e31deb0f4c9e7d4b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "user" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '0', "login" character varying COLLATE "C" NOT NULL, "email" character varying COLLATE "C" NOT NULL, "password" character varying NOT NULL, CONSTRAINT "UQ_a62473490b3e4578fd683235c5e" UNIQUE ("login"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "blog" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '0', "name" text COLLATE "C" NOT NULL, "description" text NOT NULL, "website_url" text NOT NULL, "is_membership" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_85c6532ad065a448e9de7638571" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "post" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, "version" integer NOT NULL DEFAULT '0', "title" text COLLATE "C" NOT NULL, "short_description" text COLLATE "C" NOT NULL, "content" text COLLATE "C" NOT NULL, "blog_id" uuid NOT NULL, CONSTRAINT "PK_be5fda3aac270b134ff9c21cdee" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "email_confirmation" ADD CONSTRAINT "FK_857e9c1f08bc0a9f50101621833" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session_device" ADD CONSTRAINT "FK_cd7f5572db068587c29ab1586a2" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "password_recovery" ADD CONSTRAINT "FK_d150be562deac1f539cc4b59fc4" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "post" ADD CONSTRAINT "FK_8770b84ec0b63d5c726a0681df4" FOREIGN KEY ("blog_id") REFERENCES "blog"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "post" DROP CONSTRAINT "FK_8770b84ec0b63d5c726a0681df4"`);
        await queryRunner.query(`ALTER TABLE "password_recovery" DROP CONSTRAINT "FK_d150be562deac1f539cc4b59fc4"`);
        await queryRunner.query(`ALTER TABLE "session_device" DROP CONSTRAINT "FK_cd7f5572db068587c29ab1586a2"`);
        await queryRunner.query(`ALTER TABLE "email_confirmation" DROP CONSTRAINT "FK_857e9c1f08bc0a9f50101621833"`);
        await queryRunner.query(`DROP TABLE "post"`);
        await queryRunner.query(`DROP TABLE "blog"`);
        await queryRunner.query(`DROP TABLE "user"`);
        await queryRunner.query(`DROP TABLE "password_recovery"`);
        await queryRunner.query(`DROP TABLE "session_device"`);
        await queryRunner.query(`DROP TABLE "email_confirmation"`);
    }

}
