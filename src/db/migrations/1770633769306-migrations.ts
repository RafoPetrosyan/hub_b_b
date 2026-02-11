import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770633769306 implements MigrationInterface {
    name = 'Migrations1770633769306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "slug" character varying(100) NOT NULL, "default_state" boolean NOT NULL DEFAULT true, "default_text" text, "is_additional" boolean NOT NULL DEFAULT false, "fields" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_603e09f183df0108d8695c57e28" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fbb46ad645d0f8767847530c8e" ON "policies" ("slug") `);
        await queryRunner.query(`CREATE TABLE "company_policies" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "policy_id" uuid NOT NULL, "company_id" uuid NOT NULL, "slug" character varying(100) NOT NULL, "data" jsonb, "state" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a9ab5f754b8a9769e39b127f89e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3e3d88d8f278ca74723521eb79" ON "company_policies" ("company_id", "policy_id") `);
        await queryRunner.query(`ALTER TABLE "company_policies" ADD CONSTRAINT "FK_8b964085232096f602e61852d3d" FOREIGN KEY ("policy_id") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_policies" ADD CONSTRAINT "FK_eb6b94d84fca967d21a8abd5827" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_policies" DROP CONSTRAINT "FK_eb6b94d84fca967d21a8abd5827"`);
        await queryRunner.query(`ALTER TABLE "company_policies" DROP CONSTRAINT "FK_8b964085232096f602e61852d3d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3e3d88d8f278ca74723521eb79"`);
        await queryRunner.query(`DROP TABLE "company_policies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fbb46ad645d0f8767847530c8e"`);
        await queryRunner.query(`DROP TABLE "policies"`);
    }

}
