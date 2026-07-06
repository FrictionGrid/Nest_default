import { MigrationInterface, QueryRunner } from "typeorm";

export class AddExecutiveSalesAssistantRole1776600000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "user_role" ADD VALUE 'executive'`);
        await queryRunner.query(`ALTER TYPE "user_role" ADD VALUE 'sales_assistant'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN role DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN role TYPE VARCHAR(50)`);
        await queryRunner.query(`DROP TYPE "user_role"`);
        await queryRunner.query(`CREATE TYPE "user_role" AS ENUM ('admin', 'adminsystem', 'manager', 'head_engineer', 'engineer', 'sale')`);
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN role TYPE "user_role" USING role::"user_role"`);
        await queryRunner.query(`ALTER TABLE users ALTER COLUMN role SET DEFAULT 'engineer'`);
    }

}
