import { MigrationInterface, QueryRunner } from 'typeorm';

export class ActivityLogs1776400000000 implements MigrationInterface {
  async up(qr: QueryRunner): Promise<void> {
    await qr.query(`
      CREATE TYPE log_action AS ENUM (
        'login','logout','create','update','delete','upload','download'
      );
      CREATE TYPE log_status AS ENUM ('success','failed','warning');

      CREATE TABLE activity_logs (
        id          BIGSERIAL PRIMARY KEY,
        user_id     INT REFERENCES users(id) ON DELETE SET NULL,
        user_role   VARCHAR(50),
        action      log_action  NOT NULL,
        status      log_status  NOT NULL DEFAULT 'success',
        module      VARCHAR(100) NOT NULL,
        target_id   INT,
        description VARCHAR(500),
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE INDEX idx_act_logs_user     ON activity_logs(user_id);
      CREATE INDEX idx_act_logs_action   ON activity_logs(action);
      CREATE INDEX idx_act_logs_module   ON activity_logs(module);
      CREATE INDEX idx_act_logs_created  ON activity_logs(created_at DESC);
    `);
  }

  async down(qr: QueryRunner): Promise<void> {
    await qr.query(`
      DROP TABLE IF EXISTS activity_logs;
      DROP TYPE IF EXISTS log_action;
      DROP TYPE IF EXISTS log_status;
    `);
  }
}
