import { MigrationInterface, QueryRunner } from 'typeorm';

export class TaskTeamReplannedDates1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE task_team ADD COLUMN IF NOT EXISTS replanned_start DATE`);
    await queryRunner.query(`ALTER TABLE task_team ADD COLUMN IF NOT EXISTS replanned_end DATE`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE task_team DROP COLUMN IF EXISTS replanned_start`);
    await queryRunner.query(`ALTER TABLE task_team DROP COLUMN IF EXISTS replanned_end`);
  }
}
