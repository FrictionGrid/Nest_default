import { MigrationInterface, QueryRunner } from "typeorm";

export class TaskTeamProgress1775900000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE task_team
            ADD COLUMN IF NOT EXISTS progress INT NOT NULL DEFAULT 0
            CHECK (progress >= 0 AND progress <= 100)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE task_team DROP COLUMN IF EXISTS progress
        `);
    }

}
