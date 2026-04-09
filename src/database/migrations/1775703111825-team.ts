import { MigrationInterface, QueryRunner } from "typeorm";

export class Team1775703111825 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE team (
                id   SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL UNIQUE
            );
        `);

        await queryRunner.query(`
            INSERT INTO team (name) VALUES
                ('Team 1'),
                ('Team 2'),
                ('Team 3'),
                ('Team 4'),
                ('Team Application'),
                ('Team Draf');
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE team`);
    }

}
