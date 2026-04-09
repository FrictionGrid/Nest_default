import { MigrationInterface, QueryRunner } from "typeorm";

export class ProjectTeam1775703168977 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE project_team (
                id         SERIAL PRIMARY KEY,
                project_id INTEGER NOT NULL REFERENCES project_incoming(id) ON DELETE CASCADE,
                team_id    INTEGER NOT NULL REFERENCES team(id) ON DELETE CASCADE,
                UNIQUE (project_id, team_id)
            );
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE project_team`);
    }

}
