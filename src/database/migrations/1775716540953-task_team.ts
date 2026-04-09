import { MigrationInterface, QueryRunner } from "typeorm";

export class TaskTeam1775716540953 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TYPE IF EXISTS task_status CASCADE`);
        await queryRunner.query(`
            CREATE TYPE task_status AS ENUM (
                'in_progress',
                'problem',
                'completed'
            )
        `);

        await queryRunner.query(`
            CREATE TABLE task_team (
                id               SERIAL PRIMARY KEY,
                user_id          INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                project_id       INT NOT NULL REFERENCES project_incoming(id) ON DELETE CASCADE,
                task_name        VARCHAR(255) NOT NULL,
                task_description TEXT,
                end_date         DATE,
                status           task_status NOT NULL DEFAULT 'in_progress',
                created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE task_team`);
        await queryRunner.query(`DROP TYPE task_status`);
    }

}
