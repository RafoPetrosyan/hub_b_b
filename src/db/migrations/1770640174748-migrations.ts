import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770640174748 implements MigrationInterface {
    name = 'Migrations1770640174748'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."company_refund_policy_refund_window_enum" AS ENUM('72 hours', '48 hours', '24 hours', '4 hours')`);
        await queryRunner.query(`CREATE TABLE "company_refund_policy" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "automatic_refunds" boolean NOT NULL DEFAULT false, "require_deposit" boolean NOT NULL DEFAULT false, "refund_window" "public"."company_refund_policy_refund_window_enum", "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_68a2ff0f4156418af34afac601" UNIQUE ("company_id"), CONSTRAINT "PK_4764a155e5c688a0945fc1db03d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_68a2ff0f4156418af34afac601" ON "company_refund_policy" ("company_id") `);
        await queryRunner.query(`CREATE TABLE "company_deposit_requirements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "state" boolean NOT NULL DEFAULT false, "amount" double precision NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "REL_29c65b81697cc0f3543503cb9f" UNIQUE ("company_id"), CONSTRAINT "PK_b2c0653bce4559ed09c8b0050b8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_29c65b81697cc0f3543503cb9f" ON "company_deposit_requirements" ("company_id") `);
        await queryRunner.query(`CREATE TABLE "payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying(255) NOT NULL, "description" text, "default_state" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_34f9b8c6dfb4ac3559f7e2820d1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a793d7354d7c3aaf76347ee5a6" ON "payment_methods" ("name") `);
        await queryRunner.query(`CREATE TABLE "company_payment_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "payment_method_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "description" text, "state" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_7f9233e77d51ef422b9c7430f6a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_65484434252c49ce46ca2530fa" ON "company_payment_methods" ("company_id", "payment_method_id") `);
        await queryRunner.query(`ALTER TABLE "company_refund_policy" ADD CONSTRAINT "FK_68a2ff0f4156418af34afac6013" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_deposit_requirements" ADD CONSTRAINT "FK_29c65b81697cc0f3543503cb9fa" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_payment_methods" ADD CONSTRAINT "FK_0da475b0e73636fc00340d4aab5" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_payment_methods" ADD CONSTRAINT "FK_86bc1e405da6ac0ce8fce3cf75e" FOREIGN KEY ("payment_method_id") REFERENCES "payment_methods"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_payment_methods" DROP CONSTRAINT "FK_86bc1e405da6ac0ce8fce3cf75e"`);
        await queryRunner.query(`ALTER TABLE "company_payment_methods" DROP CONSTRAINT "FK_0da475b0e73636fc00340d4aab5"`);
        await queryRunner.query(`ALTER TABLE "company_deposit_requirements" DROP CONSTRAINT "FK_29c65b81697cc0f3543503cb9fa"`);
        await queryRunner.query(`ALTER TABLE "company_refund_policy" DROP CONSTRAINT "FK_68a2ff0f4156418af34afac6013"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_65484434252c49ce46ca2530fa"`);
        await queryRunner.query(`DROP TABLE "company_payment_methods"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a793d7354d7c3aaf76347ee5a6"`);
        await queryRunner.query(`DROP TABLE "payment_methods"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_29c65b81697cc0f3543503cb9f"`);
        await queryRunner.query(`DROP TABLE "company_deposit_requirements"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_68a2ff0f4156418af34afac601"`);
        await queryRunner.query(`DROP TABLE "company_refund_policy"`);
        await queryRunner.query(`DROP TYPE "public"."company_refund_policy_refund_window_enum"`);
    }

}
