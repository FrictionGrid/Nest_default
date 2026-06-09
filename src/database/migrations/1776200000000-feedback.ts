import { MigrationInterface, QueryRunner } from 'typeorm';

export class Feedback1776200000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE feedback (
        id          SERIAL PRIMARY KEY,
        message     TEXT NOT NULL,
        user_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at  TIMESTAMPTZ DEFAULT now()
      )
    `);
    await queryRunner.query(`
      CREATE INDEX idx_feedback_user ON feedback(user_id)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS feedback`);
  }
}
