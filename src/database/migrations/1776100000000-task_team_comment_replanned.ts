import { MigrationInterface, QueryRunner } from 'typeorm';

export class TaskTeamCommentReplanned1776100000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'replanned'`);
    await queryRunner.query(`ALTER TABLE task_team ADD COLUMN IF NOT EXISTS task_comment TEXT`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE task_team DROP COLUMN IF EXISTS task_comment`);
    // PostgreSQL ไม่รองรับ DROP VALUE จาก enum โดยตรง
  }
}
