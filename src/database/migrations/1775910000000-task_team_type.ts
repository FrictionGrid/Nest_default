import { MigrationInterface, QueryRunner } from "typeorm";

export class TaskTeamType1775910000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE task_team
            ADD COLUMN IF NOT EXISTS task_type VARCHAR(100) NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE task_team DROP COLUMN IF EXISTS task_type
        `);
    }

}
