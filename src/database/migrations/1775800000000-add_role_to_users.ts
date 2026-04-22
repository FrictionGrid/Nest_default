import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUsers1775800000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "user_role" AS ENUM ('admin', 'adminsystem', 'manager', 'head_engineer', 'engineer', 'sale')
        `);
        await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS role "user_role" NOT NULL DEFAULT 'engineer'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE users DROP COLUMN IF EXISTS role`);
        await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
    }

}
