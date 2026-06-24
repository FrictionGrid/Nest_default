import { MigrationInterface, QueryRunner } from 'typeorm';

export class ProjectTeamStatusDates1776500000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TYPE project_team_status AS ENUM ('in_progress', 'delayed', 'completed');
    `);

    await queryRunner.query(`
      ALTER TABLE project_team
        ADD COLUMN status     project_team_status NOT NULL DEFAULT 'in_progress',
        ADD COLUMN start_date DATE,
        ADD COLUMN end_date   DATE;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE project_team
        DROP COLUMN IF EXISTS status,
        DROP COLUMN IF EXISTS start_date,
        DROP COLUMN IF EXISTS end_date;
    `);

    await queryRunner.query(`DROP TYPE IF EXISTS project_team_status;`);
  }
}
