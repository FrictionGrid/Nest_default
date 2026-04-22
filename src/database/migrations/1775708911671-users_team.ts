import { MigrationInterface, QueryRunner } from "typeorm";

export class UsersTeam1775708911671 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE user_teams (
                id       SERIAL PRIMARY KEY,
                user_id  INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                team_id  INT NOT NULL REFERENCES team(id) ON DELETE CASCADE,
                UNIQUE (user_id, team_id)
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS user_teams`);
    }

}
