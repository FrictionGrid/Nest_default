import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUsers1775800000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users
            ADD COLUMN IF NOT EXISTS role VARCHAR(50) NOT NULL DEFAULT 'engineer'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE users DROP COLUMN IF EXISTS role
        `);
    }

}
