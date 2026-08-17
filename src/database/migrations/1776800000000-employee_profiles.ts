import { MigrationInterface, QueryRunner } from 'typeorm';

export class EmployeeProfiles1776800000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE employee_profiles (
        id                    SERIAL PRIMARY KEY,
        user_id               INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
        first_name            VARCHAR(100) NOT NULL,
        last_name             VARCHAR(100) NOT NULL,
        employee_title        VARCHAR(150),
        employee_department   VARCHAR(150),
        created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS employee_profiles`);
  }
}
