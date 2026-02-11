import { MigrationInterface, QueryRunner } from "typeorm";

export class Migrations1770305227543 implements MigrationInterface {
    name = 'Migrations1770305227543'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_services" DROP CONSTRAINT "FK_b5571c5712b23fe34e7e7dda8ed"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP CONSTRAINT "FK_dbff882850c0db7ac4198292101"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP CONSTRAINT "UQ_d22c61d4d1d9642de3466530279"`);
        await queryRunner.query(`CREATE TABLE "company_base_services" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" uuid NOT NULL, "service_id" uuid NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_67ed8996615c5d1afd343fbd4fb" UNIQUE ("company_id", "service_id"), CONSTRAINT "PK_7730e0d5e1b232bbc949dde629f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "company_specializations" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "business_id" uuid NOT NULL, "name" character varying(255) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "archived" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_8e77fa459a900d7c001057e8737" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "company_id"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "service_id"`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "business_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "specialization_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "name" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "duration_minutes" integer`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "required_staff" integer`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "buffer_minutes" integer`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "price" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "is_active" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "archived" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "company_base_services" ADD CONSTRAINT "FK_9a40121c8dcca27c8e34f8d820d" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_base_services" ADD CONSTRAINT "FK_4eb45aa13461633f00f3bd5f3db" FOREIGN KEY ("service_id") REFERENCES "base_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD CONSTRAINT "FK_64ded91b99f0f7d6b26b4617b3c" FOREIGN KEY ("business_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD CONSTRAINT "FK_c84508c8c2710cde49665ad8c63" FOREIGN KEY ("specialization_id") REFERENCES "company_specializations"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_specializations" ADD CONSTRAINT "FK_4350e1866c0d40dde392819b919" FOREIGN KEY ("business_id") REFERENCES "companies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company_specializations" DROP CONSTRAINT "FK_4350e1866c0d40dde392819b919"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP CONSTRAINT "FK_c84508c8c2710cde49665ad8c63"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP CONSTRAINT "FK_64ded91b99f0f7d6b26b4617b3c"`);
        await queryRunner.query(`ALTER TABLE "company_base_services" DROP CONSTRAINT "FK_4eb45aa13461633f00f3bd5f3db"`);
        await queryRunner.query(`ALTER TABLE "company_base_services" DROP CONSTRAINT "FK_9a40121c8dcca27c8e34f8d820d"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "archived"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "is_active"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "buffer_minutes"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "required_staff"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "duration_minutes"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "specialization_id"`);
        await queryRunner.query(`ALTER TABLE "company_services" DROP COLUMN "business_id"`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "service_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD "company_id" uuid NOT NULL`);
        await queryRunner.query(`DROP TABLE "company_specializations"`);
        await queryRunner.query(`DROP TABLE "company_base_services"`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD CONSTRAINT "UQ_d22c61d4d1d9642de3466530279" UNIQUE ("company_id", "service_id")`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD CONSTRAINT "FK_dbff882850c0db7ac4198292101" FOREIGN KEY ("service_id") REFERENCES "base_services"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company_services" ADD CONSTRAINT "FK_b5571c5712b23fe34e7e7dda8ed" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
